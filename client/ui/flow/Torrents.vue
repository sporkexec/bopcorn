<template>
    <div>
        <div class="dropZone" ref="dropZone">drop zone</div>
        <hr>
        <b>all the shit you stole 🏴‍☠️</b>
        <ul>
            <li v-for="torrent in torrents" :key="torrent.infoHash">
                <button v-if="torrent.isMine" @click="addQueueItem(torrent)">NQ</button>
                {{torrent.name}}, size {{torrent.length}}, progress {{torrent.progress}}
            </li>
        </ul>
    </div>
</template>

<script>
import dragDrop from 'drag-drop';
export default {
    computed: {
        room() {
            return this.$store.state.server.room;
        },
        torrents() {
            return this.$store.state.webtorrent.torrents;
        },
    },
    methods: {
        addQueueItem(torrent) {
            const queueItem = {
                roomId: this.room.id,
                contentUri: torrent.magnetURI,
                // computed client side. do we even want to accept this?
                // we'll need to revalidate for each client anyways.
                filesize: torrent.length,
                duration: 201, // 3m 21s
                title: torrent.name, // TODO parse metadata from content
                artist: 'dozebois',
            };
            this.$store.serverTx('addQueueItem', {queueItem});
        },
        async onDrop(files) {
            const roomId = this.room.id;
            const torrentPromises = files.map(file => {
                // TODO: limit sizes/mimetypes, extract metadata/art, possibly transcode
                return this.$store.dispatch('webtorrent/seedFile', {file, roomId});
            });
            if(torrentPromises.length === 1) {
                // Auto queue if a single file was dropped
                const torrent = await torrentPromises[0];
                this.addQueueItem(torrent);
            }
        },
    },
    mounted() {
        this.removeDropEvents = dragDrop(this.$refs.dropZone, this.onDrop);
    },
    beforeDestroy() {
        this.removeDropEvents && this.removeDropEvents();
    },
}
</script>

<style scoped>
.dropZone {
  display: inline-block;
  background: #eee;
  border: 1px solid #ddd;
  padding: 20px 40px;
  margin: 10px 0;
}
</style>
