const WebSocketServer = require('websocket').server;

class BopcornServerApi {
    constructor(expressServer, db) {
        this.db = db;
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
            'joinRoom': this.rxJoinRoom,
            'createRoom': this.rxCreateRoom,
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
            // type=binary -> message.binaryData
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
        // For sync handlers there is usually no result, this is just async compat
        const result = handler.bind(this, connection)(eventData);
        Promise.resolve(result).catch(err => console.error(err));
    }

    // Everything clients can send us, add these to rxEventHandlers

    async rxRegisterGuest(connection, eventData) {
        const user = await this.db.userCreateGuest(eventData.name);
        console.log(`registerGuest: ${user.name}`);
        connection.bopcorn_user_id = user.id;
        this._txEvent(connection, 'whoami', {user});
    }

    async rxCreateRoom(connection, eventData) {
        const room = await this.db.roomCreate(connection.bopcorn_user_id, eventData.name);
        console.log(`createRoom: ${room.name}`);
        this._txEvent(connection, 'createRoom', {room});
    }

    async rxJoinRoom(connection, eventData) {
        const room = await this.db.roomGet(eventData.roomId);

        // if(!room.isOpenInvites): // TODO authorization
        //     pass if has a role,
        //     else parse an invite token and check creator against room.inviterIds

        await this.db.roomOccupancySet(eventData.roomId, connection.bopcorn_user_id);
        this._txEvent(connection, 'joinRoom', {room})
    }

    // TODO: broadcast tx events to room
}

module.exports = BopcornServerApi;
