import Store from './store';
import ServerWsApi from './api';
import App from './ui/App.vue';
import Vue from 'vue';
// import WebTorrent from 'webtorrent';

function main() {
    const serverWsParams = ['ws://' + window.location.host, 'bopcorn-api'];

    // Store receives updates from api via dispatch, sends events via serverApi.tx
    const store = new Store();
    const serverApi = new ServerWsApi(serverWsParams);
    store.commit('server/_linkServerApi', serverApi);

    // TODO: make wt, hook into torrent store
    // let wtClient = new WebTorrent();

    const app = new Vue({
        el: '#bopcornRoot',
        store,
        components: { App },
        render: h => h('app'),
    });
}

main();
