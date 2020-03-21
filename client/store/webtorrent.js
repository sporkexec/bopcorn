import Vue from 'vue';

export default {
    namespaced: true,
    state: () => ({
        torrents: {}, // Not gonna grow huge, we can prune content after awhile
        _wtProxy: undefined, // returns wt instance, it mutates the store if added directly
    }),
    mutations: {
        _setWtInstance(state, wt) {
            state._wtProxy = () => wt;
            console.log('wt', wt);
        },
        updateWtTorrent(state, wtTorrent) {
            const t = wtTorrent; // wtTorrents stay internal, we use these
            Vue.set(state.torrents, t.infoHash, {
                name: t.name,
                infoHash: t.infoHash,
                magnetURI: t.magnetURI,
                done: t.done,
                progress: t.progress, // 0.998
                timeRemaining: t.timeRemaining, // ms
                numPeers: t.numPeers,
                // bytes
                length: t.length,
                downloaded: t.downloaded,
                uploaded: t.uploaded,
                downloadSpeed: t.downloadSpeed,
                uploadSpeed: t.uploadSpeed,
                isMine: true,
            });
        },
    },
    actions: {
        seedFile({state, commit}, {file, roomId}) {
            return new Promise((resolve, reject) => {
                console.log('trying to seed...');
                // Isolate swarms for reasons, roomId should stay random and unindexed
                window.wt = state._wtProxy();
                state._wtProxy().seed(file, {info: {roomId}}, wtTorrent => {
                    // Keep stats updated, TODO faster feedback for large files?
                    commit('updateWtTorrent', wtTorrent);
                    wtTorrent.on('upload', () => commit('updateWtTorrent', wtTorrent));
                    wtTorrent.on('download', () => commit('updateWtTorrent', wtTorrent));
                    wtTorrent.on('done', () => commit('updateWtTorrent', wtTorrent));
                    console.log('seeding!', wtTorrent.name, wtTorrent.infoHash, wtTorrent);
                    resolve(state.torrents[wtTorrent.infoHash]);
                });
            });
        },
    },
};
