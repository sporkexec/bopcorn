const sqlite3 = require('sqlite3').verbose();
const schema = require('./schema.js');

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
}

module.exports = DB;
