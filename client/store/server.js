export default {
    namespaced: true,
    state: () => ({
        // Use a new state object each time, prevents pollution in eg tests
        whoami: {},
        room: {},
        roomOccupants: [],
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
        _setServerTx(state, tx) {
            // Used once to wire serverWs <-> serverStore
            // tx(eventName, eventData, headers) -> txId
            state.serverWsConnection.txMethod = tx;
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
        },
        rx_roomOccupancy({commit}, {occupants}) {
            commit('setRoomOccupants', occupants);
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
