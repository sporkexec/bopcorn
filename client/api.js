const EventEmitter = require('events');
const W3CWebSocket = require('websocket').w3cwebsocket;

// event queueing/acking - events need to be mostly idempotent for this to work
// tx: client minted id (do not persist on server), data, has it been sent yet
// rx: nothing to ack (server shouldn't care), we could queue for perf/dispatch/etc reasons but no connectivity need
//
// client assumes flakey connection to server, server doesn't care about bad connections
//
// use client.rx.on to receive events from server, use client.tx to send events
// we want to expose all the rx functionality so the consumer can manage their own listeners,
// whereas tx leaves more control to this class for retries/etc

class BopcornClientApi {
    constructor(...wsParams) {
        this._wsParams = wsParams;
        this._wsConnection = null;

        // Outgoing events are stored and retried on a timer, deleted upon ack from server
        this._txSenderStates = {}; // {txId: {payload, sendTryTimes: [time, ...]}}
        this._txSender();

        // Incoming events are announced here. Consumers listen, we relay what the server emits
        this.rx = new EventEmitter();

        this.wsConnect();
    }

    tx(eventName, eventData, headers) {
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

    wsConnect() {
        this._wsConnection = new W3CWebSocket(...this._wsParams);
        this._wsConnection.onmessage = this._onWsMessage.bind(this);
        this._wsConnection.onopen = function() { console.log('ws connected'); };
        this._wsConnection.onclose = function() { console.log('ws closed'); };
        this._wsConnection.onerror = function() { console.error('ws err'); };
    }

    _encode(raw) { return JSON.stringify(raw); }
    _decode(serialized) { return JSON.parse(serialized); }

    _onWsMessage(e) {
        // Parse all incoming events and emit to consumers
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

        // Send to API consumers, whatever in the app is listening
        this.rx.emit(eventName, eventData);
    }

    _txSender() {
        // Send queued events out to server
        if(this._wsConnection === null || this._wsConnection.readyState !== this._wsConnection.OPEN) {
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
            this._wsConnection.send(state.payload);
        }

        // Run this method infinitely, sending+retrying when queued events exist
        setTimeout(this._txSender.bind(this), 1000);
    }
}

module.exports = BopcornClientApi;
