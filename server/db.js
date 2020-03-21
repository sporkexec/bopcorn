const sqlite3 = require('sqlite3').verbose();
const schema = require('./schema.js');

class DB {
    constructor() {
        this.connection = new sqlite3.Database(':memory:');
        this.connection.serialize();
    }

    async _all(query, params) { // async wrapper
        return new Promise((resolve, reject) => {
            this.connection.all(query, params || [], function(err, rows) {
                if(err) {
                    reject(err);
                } else {
                    resolve(rows);
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

    createTables() {
        schema.tableStatements.forEach(sql => this.connection.run(sql));
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

    async roomGet(roomId) {
        let row = await this._get("SELECT * FROM rooms WHERE id = ?", roomId);
        let roles = await this._all("SELECT userId, role FROM roomRoles WHERE roomId = ?", roomId);
        roles.forEach(r => {
            if(r.role == 'creator') {
                row.creatorId = r.userId;
            } else if(r.role == 'moderator') {
                row.moderatorIds = row.moderatorIds || [];
                row.moderatorIds.push(r.userId);
            } else if(r.role == 'inviter') {
                row.inviterIds = row.inviterIds || [];
                row.inviterIds.push(r.userId);
            }
        });
        return row;
    }

    async roomCreate(creatorUserId, name) {
        const roomId = this.genId();
        await this._run("INSERT INTO rooms (id, name) VALUES (?, ?)", [roomId, name]);
        await this._run("INSERT INTO roomRoles (roomId, userId, role) VALUES (?, ?, ?)", [roomId, creatorUserId ,'creator']);
        return await this.roomGet(roomId);
    }

    async roomOccupancySet(roomId, userId, djSeatOccupied) {
        const seat = djSeatOccupied || null;
        const validity = 60 * 5; // Reap after 5m of no updates
        const expiry = Date.now() + validity;
        await this._run(`INSERT INTO roomOccupants (roomId, userId, djSeatOccupied, inactivityExpiryUnixtime)
            VALUES (?, ?, ?, ?)`, [roomId, userId, seat, expiry]);
        // TODO: bump expiry on collision?
        console.log(`roomOccupancySet for ${userId} in ${roomId}`);
    }

    async roomOccupancyGet(roomId) {
        return await this._all(`SELECT userId, djSeatOccupied, name
            FROM roomOccupants
            INNER JOIN users
            ON users.id = roomOccupants.userId
            WHERE roomId = ?`, roomId);
    }

    async roomOccupancyGetUser(roomId, userId) {
        return await this._get(`SELECT userId, djSeatOccupied, name
            FROM roomOccupants
            INNER JOIN users
            ON users.id = roomOccupants.userId
            WHERE roomId = ? AND userId = ?`, [roomId, userId]);
    }

    async roomOccupancyRemove(roomId, userId) {
        return await this._all(`DELETE FROM roomOccupants
            WHERE roomId = ? AND userId = ?`, [roomId, userId]);
    }

    async queueItemsAdd(userId, queueItemInput) {
        const id = this.genId();
        // TODO append instead, maybe allow mods+ to directly insert to an index?
        // actually that makes things hard for clients to recalc, maybe always append and reorder with separate tx?
        const playlistIndex = 1;
        const validity = 60 * 60; // 1h, TODO calculate from reported duration, update upon queue reorder, cleanup
        const expiry = Date.now() + validity;
        const qi = queueItemInput;
        await this._run(`
            INSERT INTO queueItems (id, roomId, playlistIndex, queuerUserId, expiryUnixtime, contentUri, duration, filesize, title, artist)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, qi.roomId, playlistIndex, userId, expiry, qi.contentUri, qi.duration, qi.filesize, qi.title, qi.artist]);
        return id;
    }

    async queueItemsGet(roomId) {
        return await this._all(`SELECT * FROM queueItems
            WHERE roomId = ? AND expiryUnixtime > ?
            ORDER BY playlistIndex`, [roomId, Date.now()]);
    }

    async queueItemsGetItem(itemId) {
        return await this._get(`SELECT * FROM queueItems WHERE id = ?`, [itemId]);
    }
}

module.exports = DB;
