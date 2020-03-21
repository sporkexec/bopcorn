import Vue from 'vue';

export default {
    namespaced: true,
    state: () => ({
        // Use a new state object each time, prevents pollution in eg tests
        whoami: {},
        queueItems: {},
        room: {},
        roomOccupants: {}, // roomOccupant.userId -> roomOccupant + name
        serverWsConnection: {
            txMethod: undefined, // Sends events to server through ws
        },
    }),
    mutations: {
        setWhoami(state, whoami) {
            state.whoami = whoami;
        },
        setRoom(state, room) {
            state.room = room;
        },
        setRoomOccupants(state, occupants) {
            state.roomOccupants = occupants;
        },
        addRoomOccupant(state, occupant) {
            Vue.set(state.roomOccupants, occupant.userId, occupant);
        },
        removeRoomOccupant(state, {userId}) {
            delete state.roomOccupants[userId];
        },
        setQueueItems(state, queueItems) {
            state.queueItems = queueItems;
        },
        addQueueItem(state, queueItem) {
            Vue.set(state.queueItems, queueItem.id, queueItem);
        },

        _linkServerApi(state, serverApi) {
            // Used once to wire serverWs <-> serverStore
            state.serverWsConnection.txMethod = serverApi.tx.bind(serverApi);
            serverApi.storeDispatch = this.dispatch.bind(this); // calls _rx
        },
    },
    actions: {
        // Prefix with rx to listen for server events
        rx_whoami({commit}, {user}) {
            commit('setWhoami', user);
        },
        rx_joinRoom({store, commit}, {room}) {
            commit('setRoom', room);
            this.serverTx('reloadRoomOccupancy', {roomId: room.id});
            this.serverTx('reloadQueueItems', {roomId: room.id});
        },
        rx_roomOccupancy({commit}, {occupants}) {
            // From list into kv keyed by userId
            const occupantsKv = occupants.reduce((map, o) => (map[o.userId] = o, map), {});
            commit('setRoomOccupants', occupantsKv);
        },
        rx_roomOccupancyAdd({commit, state}, {occupant}) {
            commit('addRoomOccupant', occupant);
        },
        rx_roomOccupancyRemove({commit, state}, {userId}) {
            commit('removeRoomOccupant', {userId});
        },
        rx_queueItems({commit}, {queueItems}) {
            // From list into kv keyed by id
            const queueItemsKv = queueItems.reduce((map, qi) => (map[qi.id] = qi, map), {});
            commit('setQueueItems', queueItemsKv);
        },
        rx_addQueueItem({commit, state}, {queueItem}) {
            commit('addQueueItem', queueItem)
        },

        // Internal
        _rx({dispatch}, {eventName, eventData}) {
            // Server event received
            console.log('rx', eventName, eventData);
            return dispatch(`rx_${eventName}`, eventData);
        },
        _tx({state}, {eventName, eventData, headers}) {
            // store.serverTx is easier to use, use that
            console.log('tx', eventName, eventData);
            return state.serverWsConnection.txMethod(eventName, eventData, headers);
        },
    },
};
