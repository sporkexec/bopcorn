import Vue from 'vue'
import Vuex from 'vuex'
import ServerModule from './server';

export default function() {
    Vue.use(Vuex);
    const store = new Vuex.Store({
        strict: true,
        modules: {
            server: ServerModule,
            // local: LocalModule,
            // webtorrent: WebtorrentModule,
        },
    });

    store.serverTx = function(eventName, eventData, headers) {
        // Sugar for sending server events, makes these equivalent:
        // this.$store.serverTx(registerGuest, {name: 'bob'}});
        // this.$store.dispatch('server/_tx', {eventName: 'registerGuest', eventData: {name: 'bob'}});
        return this.dispatch('server/_tx', {eventName, eventData, headers});
    }.bind(store);

    return store;
};
