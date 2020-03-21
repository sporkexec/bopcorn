<template>
    <div>
        <b>90 hours of nonstop rock'n'roll after THESE MESSAGES FROM OUR SPONSORS:</b><br>
        <ul>
            <li v-for="queueItem in queueItems">
                <p>{{queueItem.title}} - {{queueItem.artist}} ({{queueItem.duration}}s)</p>
                <p>from {{itemIdToUserName[queueItem.id]}}, #{{queueItem.playlistIndex}} in queue, id {{queueItem.id}}</p>
                <p>url: {{queueItem.contentUri}}</p>
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
    },
}
</script>

<style scoped>
</style>
