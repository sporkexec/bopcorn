const W3CWebSocket = require('websocket').w3cwebsocket;

// event queueing/acking - events need to be mostly idempotent for this to work
// tx: client minted id (do not persist on server), data, has it been sent yet
// rx: nothing to ack (server shouldn't care), we could queue for perf/dispatch/etc reasons but no connectivity need
// client assumes flakey connection to server, server doesn't care about bad connections

class BopcornClientApi {
    constructor(...wsParams) {
        this.wsParams = wsParams;
        this.wsConnection = null;

        this.rxEventHandlers = {
            // Add {eventName: this.rxSomeMethodName} entries to listen for
            // incoming events from the server.
            'whoami': this.rxWhoami,
        };

        // Outgoing events are stored and retried on a timer, deleted upon ack from server
        this._txSenderStates = {}; // {txId: {payload, sendTryTimes: [time, ...]}}
        this._txSender();

        this.connect();
    }

    connect() {
        this.wsConnection = new W3CWebSocket(...this.wsParams);
        this.wsConnection.onmessage = this._rx.bind(this);
        // fluff
        this.wsConnection.onopen = function() { console.log('ws connected'); };
        this.wsConnection.onclose = function() { console.log('ws closed'); };
        this.wsConnection.onerror = function() { console.log('ws err'); };
    }

    _encode(raw) { return JSON.stringify(raw); }
    _decode(serialized) { return JSON.parse(serialized); }

    _rx(e) {
        // Parse all incoming events and route to handlers
        if (typeof e.data !== 'string') {
            console.error(`received non-string: ${e.data}`);
            return;
        }

        let eventName, eventData;
        [eventName, eventData] = this._decode(e.data);

        // Server acked one of our sent events, we're done with it
        if (eventName === '_ack') {
            delete this._txSenderStates[eventData.txId];
            return;
        }

        // Dispatch to rx methods
        const handler = this.rxEventHandlers[eventName];
        if (!handler) {
            console.error(`ignoring unknown event: ${eventName}`);
            return;
        }
        handler(eventData);
    }

    _tx(eventName, eventData, headers) {
        // 8 char alphanum, solely for ack+logs
        const txId = Math.random().toString(36).substr(2, 8);
        headers = headers || {};
        headers.txId = txId;

        // Enqueue event to be sent to server
        this._txSenderStates[txId] = {
            payload: this._encode([eventName, eventData, headers]),
            sendTryTimes: [],
        };
        return txId;
    }

    _txSender() {
        if(this.wsConnection === null || this.wsConnection.readyState !== this.wsConnection.OPEN) {
            // TODO reconnect
            console.log('connection not ready');
            setTimeout(this._txSender.bind(this), 1000);
            return;
        }

        // Each outgoing event can be retried some number of times on a delay
        const now = Date.now();
        for(const txId in this._txSenderStates) {
            let state = this._txSenderStates[txId];

            const retryCount = state.sendTryTimes.length;
            if (retryCount > 3) {
                console.log(`${txId} aborted, too many retries`)
                delete this._txSenderStates[txId];
                continue;
            }

            const prevTryTime = state.sendTryTimes[retryCount-1] || 0;
            if (now - prevTryTime < 1000) {
                console.log(`${txId} waiting`)
                // TODO backoff with retryCount
                continue;
            }

            console.log(`${txId} sending`)
            state.sendTryTimes.push(now);
            this.wsConnection.send(state.payload);
        }

        // Run this method infinitely, sending+retrying when queued events exist
        setTimeout(this._txSender.bind(this), 1000);
    }

    // Everything we can send the server, no need to specify handlers like rx

    txRegisterGuest(name) {
        this._tx('registerGuest', {name});
    }

    // Everything the server can send us, add these to rxEventHandlers

    rxWhoami(eventData) {
        console.log('server says we are', eventData.user);
    }
}

module.exports = BopcornClientApi;
