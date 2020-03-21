const WebSocketServer = require('websocket').server;

class BopcornServerApi {
    constructor(expressServer) {
        this.expressServer = expressServer;
        this.wsServer = new WebSocketServer({httpServer: this.expressServer, autoAcceptConnections: false});
        this.wsServer.on('request', this.onConnectionRequest.bind(this));

        this.rxEventHandlers = {
            // Add {eventName: this.rxSomeMethodName} entries to listen for
            // incoming events on any client connection.
            'register': this.rxRegisterUser,
        };
    }

    _encode(raw) { return JSON.stringify(raw); }
    _decode(serialized) { return JSON.parse(serialized); }

    onConnectionRequest(request) {
        // if (!originIsAllowed(request.origin)) {
        //   // Make sure we only accept requests from an allowed origin
        //   request.reject();
        //   console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        //   return;
        // }

        const connection = request.accept('bopcorn-api', request.origin);
        console.log('connection accepted');
        connection.on('close', function(reasonCode, description) { console.log('close'); });
        connection.on('message', this._rx.bind(this, connection));
    }

    _txEvent(connection, eventName, eventData) {
        const payload = this._encode([eventName, eventData]);
        connection.sendUTF(payload);
    }

    _rx(connection, message) {
        // Parse all incoming events and route to handlers
        if (message.type !== 'utf8') {
            console.log(`ignoring message type {message.type}`);
            return;
        }

        let eventName, eventData, headers;
        [eventName, eventData, headers] = this._decode(message.utf8Data);

        if (headers.txId) {
            // Immediately ack and keep processing event
            this._txEvent(connection, '_ack', {txId: headers.txId});
        }

        // Dispatch to rx methods
        const handler = this.rxEventHandlers[eventName];
        if (!handler) {
            console.error(`ignoring unknown event: ${eventName}`);
            return;
        }
        handler.bind(this, connection)(eventData);

        // else if (message.type === 'binary') {
        // console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
    }

    // Everything clients can send us, add these to rxEventHandlers

    rxRegisterUser(connection, eventData) {
        console.log(`rxRegisterUser: ${eventData.name}`);
        this._txEvent(connection, 'register', {'name': 'herpderp'});
    }

    // TODO: broadcast tx events
}

module.exports = BopcornServerApi;
