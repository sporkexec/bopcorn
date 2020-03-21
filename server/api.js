const WebSocketServer = require('websocket').server;

class BopcornServerApi {
    constructor(expressServer, datastore) {
        this.datastore = datastore;
        this.expressServer = expressServer;
        this.wsServer = new WebSocketServer({httpServer: this.expressServer, autoAcceptConnections: false});
        this.wsServer.on('request', this.onConnectionRequest.bind(this));

        this.rxAnonEvents = [
            // All other events will require a user/guest
            'registerGuest',
        ];
        this.rxEventHandlers = {
            // Add {eventName: this.rxSomeMethodName} entries to listen for
            // incoming events on any client connection.
            'registerGuest': this.rxRegisterGuest,
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
        connection.bopcorn_user_id = null;
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

        // Require a user/guest, not anonymous
        if (!connection.bopcorn_user_id && this.rxAnonEvents.indexOf(eventName) === -1) {
            console.error(`ignoring ${eventName} event from anonymous connection`);
            return;
        }
        handler.bind(this, connection)(eventData);

        // else if (message.type === 'binary') {
        // console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
    }

    // Everything clients can send us, add these to rxEventHandlers

    rxRegisterGuest(connection, eventData) {
        // this all sucks, we need promises/awaitables
        console.log(`rxRegisterGuest: ${eventData.name}`);

        const self = this;
        const userId = this.datastore.genId();
        this.datastore.createGuestUser(userId, eventData.name, function(err) {
            if(!err) {
                connection.bopcorn_user_id = userId;
                self.datastore.getUser(userId, function(err, row) {
                    if(!err) {
                        self._txEvent(connection, 'whoami', {user: row});
                    }
                });
            }
        });

    }

    // TODO: broadcast tx events to room
}

module.exports = BopcornServerApi;
