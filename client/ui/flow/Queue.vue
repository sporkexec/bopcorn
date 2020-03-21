<template>
    <div>
        <b>90 hours of nonstop rock'n'roll after THESE MESSAGES FROM OUR SPONSORS:</b><br>
        <ul>
            <li v-for="qi in queueItems">
                {{qi.title}} - {{qi.artist}} ({{qi.duration}}s) <br>
                from {{itemIdToUserName[qi.id]}}, #{{qi.playlistIndex}} in queue, id {{qi.id}} <br>
                infohash: {{qi.infoHash}} <br>
                <div v-if="torrents[qi.infoHash]">
                    {{torrents[qi.infoHash].name}}, size {{torrents[qi.infoHash].length}}, progress {{torrents[qi.infoHash].progress}}
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    computed: {
        itemIdToUserName() {
            // User+item loads are racing when joining a room
            let out = {};
            for(let id in this.queueItems) {
                const userId = this.queueItems[id].userId;
                const user = this.occupants[userId];
                out[id] = user ? user.name : '(Loading)';
            }
            return out;
        },
        queueItems() {
            return this.$store.state.server.queueItems;
        },
        occupants() {
            return this.$store.state.server.roomOccupants;
        },
        torrents() {
            return this.$store.state.webtorrent.torrents;
        },
    },
}
</script>

<style scoped>
</style>
