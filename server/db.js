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
            guestExpiryUnixtime INTEGER
        )`);
        this.connection.run(`CREATE TABLE rooms (
            id INTEGER PRIMARY KEY,
            name TEXT
            /*
            isOpenInvites bool
            djSeatCount int
            djSeatQueueModel enum(free, queue, lottery)
            djVenueOverrideEnabled bool
            default appearance/venue
            */
        )`);
        this.connection.run(`CREATE TABLE roomRoles (
            roomId INTEGER,
            userId INTEGER,
            role TEXT, /* creator, moderator, inviter */
            PRIMARY KEY(roomId, userId)
        )`);
        this.connection.run(`CREATE TABLE roomOccupants (
            roomId INTEGER,
            userId INTEGER,
            djSeatOccupied INTEGER,
            inactivityExpiryUnixtime INTEGER,
            /* position/etc for whatever fun ui */
            PRIMARY KEY(roomId, userId)
        )`);
        this.connection.run(`CREATE TABLE queueItems (
            id INTEGER PRIMARY KEY,
            roomId INTEGER,
            playlistIndex INTEGER,
            /* mediaType enum(music/movie/tv/youtube) */
            queuerUserId INTEGER,
            expiryUnixtime INTEGER,

            /* user supplied, cannot be verified */
            contentUri TEXT, /* hash/torrent/link */
            duration INTEGER,
            filesize INTEGER,
            title TEXT,
            artist TEXT
        )`);
        this.connection.run(`CREATE TABLE mediaStates (
            roomId INTEGER PRIMARY KEY,
            state TEXT, /* playing, paused, loading, idle? */
            queueItemId INTEGER,
            lastKnownPlaybackPosition INTEGER,
            lastKnownUnixtime INTEGER
        )`);
        this.connection.run(`CREATE TABLE messages (
            id INTEGER PRIMARY KEY,
            roomId INTEGER,
            userId INTEGER,
            creationUnixtime INTEGER,
            queueItemId INTEGER,
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
        await this._run("INSERT INTO users (id, name, guestExpiryUnixtime) VALUES (?, ?, ?)", [userId, name, expiry]);
        return await this.userGet(userId);
    }
}

module.exports = DB;
