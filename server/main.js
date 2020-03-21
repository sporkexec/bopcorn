const express = require('express');
const DB = require('./db.js');
const BopcornServerApi = require('./api.js');

function main() {
    const db = new DB();
    db.createTables();

    const app = express();
    app.use(express.static('webroot'));
    const expressServer = app.listen(8080);

    const apiServer = new BopcornServerApi(expressServer, db);
}

main();
