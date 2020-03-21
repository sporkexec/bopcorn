'use strict';
const express = require('express');
const DB = require('./db.js');
const BopcornServerApi = require('./api.js');

function main() {
    let db = new DB();
    db.createTables();
    db.seedData();
    db.printData();

    const app = express();
    app.use(express.static('webroot'));
    const expressServer = app.listen(8080);
    const apiServer = new BopcornServerApi(expressServer, db);
}

main();
