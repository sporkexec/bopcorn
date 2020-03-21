const BopcornClientApi = require('./api.js');
const WebTorrent = require('webtorrent');

class BopcornClient {
    constructor(clientApi, wtClient) {
        this.bcApi = clientApi;
        this.wtClient = wtClient;
    }
    main() {
        // This flows backwards because these aren't realistic flows,
        // with UI involved this'll make more sense.

        this.bcApi.rx.on('createRoom', eventData => {
            console.log('room created:', eventData.room);
        });

        this.bcApi.rx.on('whoami', eventData => {
            console.log('whoami:', eventData.user);
            // registered as guest, now make a room
            this.bcApi.tx('createRoom', {name: 'Room'});
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
