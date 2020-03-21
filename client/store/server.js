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
        _setServerTx(state, tx) {
            // Used once to wire serverWs <-> serverStore
            // tx(eventName, eventData, headers) -> txId
            state.serverWsConnection.txMethod = tx;
        },
    },
    actions: {
        // prefix with rx to listen for server events
        rx_whoami({commit}, {user}) {
            commit('setWhoami', user);
        },

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

// this.bcApi.rx.on('joinRoom', eventData => {
//     this.data.room = eventData.room;
//     this.bcApi.tx('reloadRoomOccupancy', {roomId: this.data.room.id});
// });
// this.bcApi.rx.on('roomOccupancy', eventData => {
//     this.data.roomOccupants = eventData.occupants;
//     console.log('roomOccupancy', this.data.roomOccupants);
// });

// this.bcApi.rx.on('createRoom', eventData => {
//     console.log('room created:', eventData.room);
//     // room created, now join it
//     this.bcApi.tx('joinRoom', {roomId: eventData.room.id});
// });

// this.bcApi.rx.on('whoami', eventData => {
//     console.log('whoami:', eventData.user);
//     // registered as guest, now make a room
//     this.bcApi.tx('createRoom', {name: 'Room'});
// });

// this.bcApi.tx('registerGuest', {name: 'Guest'});
