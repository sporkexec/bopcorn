import {w3cwebsocket} from 'websocket';

// Websocket client to the bopcorn server
// All outgoing (tx) events are sent from store actions via tx
// All incoming (rx) events go to the store to be persisted by calling storeDispatch

// Client assumes flakey connection to server, server doesn't care about bad connections.
// Event queueing/acking - events need to be mostly idempotent for this to work.
// tx: client minted id (do not persist on server), name, data, has it been sent yet
// rx: nothing to ack (server shouldn't care), we could queue for perf/dispatch/etc reasons but no connectivity need

export default class {
    constructor(wsServerParams) {
        // We call storeDispatch upon receiving messages
        this.storeDispatch = null;

        this.wsServerParams = wsServerParams;
        this.wsConnection = null;
        this.wsConnect();

        // Outgoing events are stored and retried on a timer, deleted upon ack from server
        this.txSenderStates = {}; // {txId: {payload, sendTryTimes: [time, ...]}}
        this.txSender();
    }

    tx(eventName, eventData, headers) {
        // 8 char alphanum, solely for ack+logs
        const txId = Math.random().toString(36).substr(2, 8);
        headers = headers || {};
        headers.txId = txId;

        // Enqueue event to be sent to server
        this.txSenderStates[txId] = {
            payload: this._encode([eventName, eventData, headers]),
            sendTryTimes: [],
        };
        return txId;
    }

    _rx(e) {
        // Parse incoming events and send to store
        if (typeof e.data !== 'string') {
            console.error(`received non-string: ${e.data}`);
            return;
        }

        let eventName, eventData;
        [eventName, eventData] = this._decode(e.data);

        // Server acked one of our sent events, we're done with it
        if (eventName === '_ack') {
            delete this.txSenderStates[eventData.txId];
            return;
        }

        // Send event to store to update state
        this.storeDispatch('server/_rx', {eventName, eventData});
    }

    wsConnect() {
        this.wsConnection = new w3cwebsocket(...this.wsServerParams);
        this.wsConnection.onmessage = this._rx.bind(this);
        this.wsConnection.onopen = function() { console.log('ws connected'); };
        this.wsConnection.onclose = function() { console.log('ws closed'); };
        this.wsConnection.onerror = function() { console.error('ws err'); };
    }

    _encode(raw) { return JSON.stringify(raw); }
    _decode(serialized) { return JSON.parse(serialized); }

    txSender() {
        // Send queued events out to server
        if(!this.wsConnection || this.wsConnection.readyState !== this.wsConnection.OPEN) {
            // TODO reconnect
            console.log('connection not ready');
            setTimeout(this.txSender.bind(this), 1000);
            return;
        }

        // Each outgoing event can be retried some number of times on a delay
        const now = Date.now();
        for(const txId in this.txSenderStates) {
            let state = this.txSenderStates[txId];

            const retryCount = state.sendTryTimes.length;
            if (retryCount > 3) {
                console.log(`${txId} aborted, too many retries`)
                delete this.txSenderStates[txId];
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
        setTimeout(this.txSender.bind(this), 1000);
    }
};
