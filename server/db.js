const sqlite3 = require('sqlite3').verbose();

class DB {
    constructor() {
        this.connection = new sqlite3.Database(':memory:');
        this.connection.serialize();
    }

    createTables() {
        this.connection.run('CREATE TABLE lorem (info TEXT)');
        this.connection.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            /* authn, appearance */
            anon_expiry_unixtime INTEGER
        )`);
        this.connection.run(`CREATE TABLE rooms (
            id INTEGER PRIMARY KEY,
            name TEXT
            /*
            is_open_invites bool
            dj_seat_count int
            dj_seat_queue_model enum(free, queue, lottery)
            dj_venue_override_enabled bool
            default appearance/venue
            */
        )`);
        this.connection.run(`CREATE TABLE room_roles (
            room_id INTEGER,
            user_id INTEGER,
            role TEXT, /* creator, moderator, inviter */
            PRIMARY KEY(room_id, user_id)
        )`);
        this.connection.run(`CREATE TABLE room_occupants (
            room_id INTEGER,
            user_id INTEGER,
            dj_seat_occupied INTEGER,
            inactivity_expiry_unixtime INTEGER,
            /* position/etc for whatever fun ui */
            PRIMARY KEY(room_id, user_id)
        )`);
        this.connection.run(`CREATE TABLE queue_items (
            id INTEGER PRIMARY KEY,
            room_id INTEGER,
            playlist_index INTEGER,
            /* media_type enum(music/movie/tv/youtube) */
            queuer_user_id INTEGER,
            expiry_unixtime INTEGER,

            /* user supplied, cannot be verified */
            content_uri TEXT, /* hash/torrent/link */
            duration INTEGER,
            filesize INTEGER,
            title TEXT,
            artist TEXT
        )`);
        this.connection.run(`CREATE TABLE media_states (
            room_id INTEGER PRIMARY KEY,
            state TEXT, /* playing, paused, loading, idle? */
            queue_item_id INTEGER,
            last_known_playback_position INTEGER,
            last_known_unixtime INTEGER
        )`);
        this.connection.run(`CREATE TABLE messages (
            id INTEGER PRIMARY KEY,
            room_id INTEGER,
            user_id INTEGER,
            creation_unixtime INTEGER,
            queue_item_id INTEGER,
            content TEXT
        )`);
    }

    seedData() {
        let stmt = this.connection.prepare("INSERT INTO lorem VALUES (?)");
        for (let i = 0; i < 10; i++) {
            stmt.run("Ipsum " + i);
        }
        stmt.finalize();
    }

    printData() {
        this.connection.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
            console.log(row.id + ": " + row.info);
        });
    }

    genId() {
        // 64b unsigned, this is a bad implementation FIXME
        return Math.random() * (2**63)
    }

    getUser(userId, callback) {
        // FIXME restrict this when we get sensitive columns
        this.connection.get("SELECT * FROM users WHERE id = ?", userId, callback);
    }

    createGuestUser(userId, name, callback) {
        const validity = 60 * 60 * 24; // register within 1d (can be extended)
        const expiry = Date.now() + validity;

        this.connection.run("INSERT INTO users (id, name, anon_expiry_unixtime) VALUES (?, ?, ?)",
            [userId, name, expiry], callback);
    }
}

module.exports = DB;
