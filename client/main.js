const BopcornClientApi = require('./api.js');
const WebTorrent = require('webtorrent');

class BopcornClient {
    constructor(clientApi, wtClient) {
        this.bcApi = clientApi;
        this.wtClient = wtClient;
    }
    main() {
        this.bcApi.rx.on('whoami', function(eventData) {
            console.log('whoami:', eventData.user);
        });
        this.bcApi.tx('registerGuest', {name: 'Guest'});
    }
}

function main() {
    const wsuri = 'ws://' + window.location.host;
    let clientApi = new BopcornClientApi(wsuri, 'bopcorn-api');
    let wtClient = new WebTorrent();
    let client = new BopcornClient(clientApi, wtClient);
    client.main()
}

main();
