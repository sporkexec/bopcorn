const sqlite3 = require('sqlite3').verbose();

class DB {
    constructor() {
        this.connection = new sqlite3.Database(':memory:');
        this.connection.serialize();
    }

    async _run(query, params) { // async wrapper
        return new Promise((resolve, reject) => {
            this.connection.run(query, params || [], function(err) {
                if(err) {
                    reject(err);
                } else {
                    resolve(this); // this = finished statement
                }
            });
        });
    }

    async _get(query, params) { // async wrapper
        return new Promise((resolve, reject) => {
            this.connection.get(query, params || [], function(err, row) {
                if(err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    createTables() {
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

    genId() { // fits in signed 64b int
        return Math.random() * (2**63)
    }

    async userGet(userId) {
        // FIXME restrict this when we get sensitive columns
        return await this._get("SELECT * FROM users WHERE id = ?", userId);
    }

    async userCreateGuest(name) {
        const userId = this.genId();
        const validity = 60 * 60 * 24; // register within 1d (can be extended)
        const expiry = Date.now() + validity;
        await this._run("INSERT INTO users (id, name, anon_expiry_unixtime) VALUES (?, ?, ?)", [userId, name, expiry]);
        return await this.userGet(userId);
    }
}

module.exports = DB;
