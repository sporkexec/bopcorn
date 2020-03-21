import Vue from 'vue'
import Vuex from 'vuex'
import ServerModule from './server';
import WebtorrentModule from './webtorrent';

export default function() {
    Vue.use(Vuex);
    const store = new Vuex.Store({
        strict: true,
        modules: {
            server: ServerModule,
            webtorrent: WebtorrentModule,
            // local: LocalModule,
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
