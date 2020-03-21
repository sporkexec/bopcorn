import Vue from 'vue';

export default {
    namespaced: true,
    state: () => ({
        infoHashesCreated: [],
        torrents: {}, // Not gonna grow huge, we can prune content after awhile
        _wtProxy: undefined, // returns wt instance, it mutates the store if added directly
    }),
    mutations: {
        _setWtInstance(state, wt) {
            state._wtProxy = () => wt;
            console.log('wt', wt);
        },
        addInfoHashCreated(state, infoHash) {
            state.infoHashesCreated.push(infoHash);
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
                isMine: state.infoHashesCreated.indexOf(t.infoHash) !== -1,
            });
        },
    },
    actions: {
        seedFile({state, commit}, {file, roomId}) {
            return new Promise((resolve, reject) => {
                console.log('trying to seed...');
                const roomSalt = roomId % 2000000000; // Stay within 32b for bencode
                // Isolate swarms for reasons, roomSalt should stay random and unindexed
                // FIXME improve randomness of IDs and don't just modulo up there
                // TODO use window.location.host as tracker? if we can run server in
                // browser we could also use it to bootstrap dht
                state._wtProxy().seed(file, {info: {roomSalt}}, wtTorrent => {
                    // Keep stats updated, TODO faster feedback for large files?
                    commit('addInfoHashCreated', wtTorrent.infoHash);
                    commit('updateWtTorrent', wtTorrent);
                    wtTorrent.on('upload', () => commit('updateWtTorrent', wtTorrent));
                    wtTorrent.on('download', () => commit('updateWtTorrent', wtTorrent));
                    wtTorrent.on('done', () => commit('updateWtTorrent', wtTorrent));
                    console.log('seeding!', wtTorrent.name, wtTorrent.infoHash, wtTorrent);
                    resolve(state.torrents[wtTorrent.infoHash]);
                });
            });
        },
        leechQueueItem({state, commit}, {queueItem}) {
            if(state.torrents[queueItem.infoHash]) {
                return;
            }

            console.log('trying to leech...', queueItem.contentUri);
            const wtTorrent = state._wtProxy().add(queueItem.contentUri);
            console.log('sent to wt...', wtTorrent);
            wtTorrent.on('ready', () => {
                if(queueItem.infoHash !== wtTorrent.infoHash) {
                    // TODO report weird shit like this to server so it can kill item,
                    // or show blame/suspicion on user/mod ui and let them decide,
                    // or have mod clients notice and tx removal itself. This particular
                    // case could be avoided by deriving infohash from magnet instead of
                    // storing it, but we'll have to deal with this class of problem a lot
                    // when the server can't verify the content.
                    console.error(`uploader's reported infohash and actual infohash do not match:`,
                        queueItem.infoHash, wtTorrent.infoHash);
                    wtTorrent.destroy();
                    return;
                }

                commit('updateWtTorrent', wtTorrent);
                wtTorrent.on('upload', () => commit('updateWtTorrent', wtTorrent));
                wtTorrent.on('download', () => commit('updateWtTorrent', wtTorrent));
                wtTorrent.on('done', () => commit('updateWtTorrent', wtTorrent));
                console.log('leeching!', wtTorrent.name, wtTorrent.infoHash, wtTorrent);
            });
        },
    },
};
