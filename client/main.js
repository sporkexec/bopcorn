const W3CWebSocket = require('websocket').w3cwebsocket;

let app_client = new W3CWebSocket('ws://192.168.2.53:49160/', 'echo-protocol');

app_client.onerror = function() {
    console.log('Connection Error');
};

app_client.onopen = function() {
    console.log('WebSocket Client Connected');

    function sendNumber() {
        if (app_client.readyState === app_client.OPEN) {
            const number = Math.round(Math.random() * 0xFFFFFF);
            app_client.send(number.toString());
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
};

app_client.onclose = function() {
    console.log('echo-protocol Client Closed');
};

app_client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
    }
};

const WebTorrent = require('webtorrent');
let wt_client = new WebTorrent();
console.log(wt_client);
