<template>
    <div>
        <h3>Welcome to {{room.name}}, {{userName}} (room {{room.id}})</h3>
        <div>
            <b>We got the whole gang here:</b><br>
            <ul>
                <li v-for="occupant in occupants" :key="occupant.userId">
                    {{occupant.name}} (id {{occupant.userId}})
                </li>
            </ul>
        </div>
        <hr>
        <UploadMedia></UploadMedia>
        <hr>
        <div>
            <b>90 hourz of nonstop rock after these messages:</b><br>
            <ul>
                <li v-for="queueItem in queueItems" :key="queueItem.id">
                    <p>{{queueItem.title}} - {{queueItem.artist}} ({{queueItem.duration}}s)</p>
                    <p>#{{queueItem.playlistIndex}} in queue, id {{queueItem.id}}</p>
                    <p>url: {{queueItem.contentUri}}</p>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import UploadMedia from './UploadMedia.vue';
export default {
    components: {UploadMedia},
    computed: {
        userName() {
            return this.$store.state.server.whoami.name;
        },
        room() {
            return this.$store.state.server.room;
        },
        occupants() {
            return this.$store.state.server.roomOccupants;
        },
        queueItems() {
            return this.$store.state.server.queueItems;
        },
    },
}
</script>

<style scoped>
</style>
