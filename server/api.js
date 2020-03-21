const WebSocketServer = require('websocket').server;

class BopcornServerApi {
    constructor(expressServer, db) {
        this.db = db;
        this.expressServer = expressServer;
        this.wsServer = new WebSocketServer({httpServer: this.expressServer, autoAcceptConnections: false});
        this.wsServer.on('request', this.onConnectionRequest.bind(this));

        this.roomToConnections = {};
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
            'reloadRoomOccupancy': this.rxReloadRoomOccupancy,
            'reloadQueueItems': this.rxReloadQueueItems,
            'addQueueItem': this.rxAddQueueItem,
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
        connection.userId = null;
        connection.roomId = null;
        console.log('connection accepted');
        connection.on('message', this._rx.bind(this, connection));
        connection.on('close', async (reasonCode, description) => {
            console.log('close');

            // Cleanup room broadcast list
            const roomId = connection.roomId;
            const userId = connection.userId;
            const conns = this.roomToConnections[roomId];
            if(!conns) {
                return;
            }
            for(let i = conns.length - 1; i >= 0; i--) {
                if(conns[i] === connection) {
                    conns.splice(i, 1);
                }
            }

            await this.roomOccupancyRemove(roomId, userId);
        });
    }

    _txEvent(connection, eventName, eventData) {
        const payload = this._encode([eventName, eventData]);
        connection.sendUTF(payload);
    }

    _txEventToRoom(roomId, eventName, eventData) {
        const payload = this._encode([eventName, eventData]);
        const connections = this.roomToConnections[roomId] || [];
        connections.forEach(conn => conn.sendUTF(payload));
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
        if (!connection.userId && this.rxAnonEvents.indexOf(eventName) === -1) {
            console.error(`ignoring ${eventName} event from anonymous connection`);
            return;
        }
        // For sync handlers there is usually no result, this is just async compat
        const result = handler.bind(this, connection)(eventData);
        Promise.resolve(result).catch(err => console.error(err));
    }

    async joinRoom(room, connection) {
        const roomId = room.id;
        const userId = connection.userId;

        await this.db.roomOccupancySet(roomId, userId);
        if(!this.roomToConnections[roomId]) {
            this.roomToConnections[roomId] = [];
        }
        this.roomToConnections[roomId].push(connection);
        connection.roomId = roomId;
        this._txEvent(connection, 'joinRoom', {room});

        const user = await this.db.roomOccupancyGetUser(roomId, userId);
        this._txEventToRoom(roomId, 'roomOccupancyAdd', {occupant: user});
    }

    async roomOccupancyRemove(roomId, userId) {
        // Delete occupancy and broadcast to room
        await this.db.roomOccupancyRemove(roomId, userId);
        this._txEventToRoom(roomId, 'roomOccupancyRemove', {userId});
    }

    // Everything clients can send us, add these to rxEventHandlers

    async rxRegisterGuest(connection, eventData) {
        const user = await this.db.userCreateGuest(eventData.name);
        console.log(`registerGuest: ${user.name}`);
        connection.userId = user.id;
        this._txEvent(connection, 'whoami', {user});
    }

    async rxCreateRoom(connection, eventData) {
        const room = await this.db.roomCreate(connection.userId, eventData.name);
        console.log(`createRoom: ${room.name}`);
        // Force join newly created rooms
        await this.joinRoom(room, connection);
    }

    async rxJoinRoom(connection, eventData) {
        const room = await this.db.roomGet(eventData.roomId);

        // if(!room.isOpenInvites): // TODO authorization
        //     pass if has a role,
        //     else parse an invite token and check creator against room.inviterIds

        await this.joinRoom(room, connection);
    }

    async rxReloadRoomOccupancy(connection, eventData) {
        let occupants = await this.db.roomOccupancyGet(eventData.roomId);

        // TODO authorization: ensure connection's user is in occupants
        // TODO decorate occupants with appearance, or otherwise send user appearance/details?

        this._txEvent(connection, 'roomOccupancy', {occupants})
    }

    async rxReloadQueueItems(connection, eventData) {
        let queueItems = await this.db.queueItemsGet(eventData.roomId);
        // TODO authorization: ensure connection's user is in occupants
        this._txEvent(connection, 'queueItems', {queueItems})
    }

    async rxAddQueueItem(connection, eventData) {
        // TODO authorization: ensure user is occupant, check DJs, check is mod
        const itemId = await this.db.queueItemsAdd(connection.userId, eventData.queueItem);
        const queueItem = await this.db.queueItemsGetItem(itemId);
        this._txEventToRoom(queueItem.roomId, 'queueItemsAdd', {queueItem});
    }
}

module.exports = BopcornServerApi;
