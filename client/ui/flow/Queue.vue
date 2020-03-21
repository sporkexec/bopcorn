<template>
    <div>
        <b>90 hours of nonstop rock'n'roll after THESE MESSAGES FROM OUR SPONSORS:</b><br>
        <ul>
            <li v-for="queueItem in queueItems" :key="queueItem.id">
                <p>{{queueItem.title}} - {{queueItem.artist}} ({{queueItem.duration}}s)</p>
                <p>#{{queueItem.playlistIndex}} in queue, id {{queueItem.id}}</p>
                <p>url: {{queueItem.contentUri}}</p>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    computed: {
        queueItems() {
            return this.$store.state.server.queueItems;
        },
    },
}
</script>

<style scoped>
</style>
