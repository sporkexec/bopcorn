const BopcornClientApi = require('./api.js');
const Store = require('./store.js');
const WebTorrent = require('webtorrent');
const React = require('react');
const ReactDOM = require('react-dom');

class App extends React.Component {
    render() {
        return <i>ok</i>;
    }
}

class BopcornClient {
    constructor(store, clientApi, wtClient) {
        this.store = store;
        this.bcApi = clientApi;
        this.wtClient = wtClient;
    }
    main() {
        // This flows backwards because these aren't realistic flows,
        // with UI involved this'll make more sense.

        this.bcApi.rx.on('createRoom', eventData => {
            console.log('room created:', eventData.room);
            // room created, now join it
            this.bcApi.tx('joinRoom', {roomId: eventData.room.id});
        });

        this.bcApi.rx.on('whoami', eventData => {
            console.log('whoami:', eventData.user);
            // registered as guest, now make a room
            this.bcApi.tx('createRoom', {name: 'Room'});
        });

        this.bcApi.tx('registerGuest', {name: 'Guest'});

        ReactDOM.render(
            <App data={this.store.data}></App>,
            document.getElementById('bopcornRoot')
        );
    }
}

function main() {
    const wsuri = 'ws://' + window.location.host;
    let clientApi = new BopcornClientApi(wsuri, 'bopcorn-api');
    let wtClient = new WebTorrent();
    let store = new Store(clientApi);
    let client = new BopcornClient(store, clientApi, wtClient);
    client.main()
}

main();
