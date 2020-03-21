const BopcornClientApi = require('./api.js');
const WebTorrent = require('webtorrent');

class BopcornClient {
    constructor(clientApi, wtClient) {
        console.log(clientApi, wtClient);
    }
}

function main() {
    const wsuri = 'ws://' + window.location.host;
    let clientApi = new BopcornClientApi(wsuri, 'bopcorn-api');
    let wtClient = new WebTorrent();
    let client = new BopcornClient(clientApi, wtClient);
    clientApi.txRegisterUser('username', true);
}

main();
