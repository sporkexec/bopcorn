export default {
    namespaced: true,
    state: () => ({
        // whoami: {},
        _wtProxy: undefined, // returns wt instance, it mutates the store if added directly
    }),
    mutations: {
        _setWtInstance(state, wt) {
            state._wtProxy = () => wt;
            console.log('wt', wt);
        },
    },
    actions: {
        // rx_whoami({commit}, {user}) {
        //     commit('setWhoami', user);
        // },
    },
};
