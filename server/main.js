const express = require('express');
const DB = require('./db.js');
const BopcornServerApi = require('./api.js');
const path = require('path')

function main() {
    const db = new DB();
    db.createTables();

    const app = express();
    if (app.get('env') === 'production') {
        app.use(express.static('dist'));
    } else {
        // Client code can rebuild in development
        const Bundler = require('parcel-bundler');
        const clientEntryPoint = path.resolve(__dirname, '../client/index.html');
        const options = {autoInstall: false, hmr: false};
        const bundler = new Bundler(clientEntryPoint, options);
        app.use(bundler.middleware());
    }

    const expressServer = app.listen(8080);
    const apiServer = new BopcornServerApi(expressServer, db);
}

main();
