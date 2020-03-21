import Store from './store';
import ServerWsApi from './api';
import App from './ui/App.vue';
import Vue from 'vue';
import WebTorrent from 'webtorrent';

function main() {
    const serverWsParams = ['ws://' + window.location.host, 'bopcorn-api'];

    // Store receives updates from api via dispatch, sends events via serverApi.tx
    const store = new Store();
    const serverApi = new ServerWsApi(serverWsParams);
    store.commit('server/_linkServerApi', serverApi);

    // Store actions call wt, wt callbacks call store actions
    const wtClient = new WebTorrent({
        tracker: false,
        dht: false,
    });
    store.commit('webtorrent/_setWtInstance', wtClient);

    const app = new Vue({
        el: '#bopcornRoot',
        store,
        components: { App },
        render: h => h('app'),
    });
}

main();
