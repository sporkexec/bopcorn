<template>
    <div>
        <button @click="addQueueItem">add dat 1 song</button>
    </div>
</template>

<script>
export default {
    computed: {
        room() {
            return this.$store.state.server.room;
        },
    },
    methods: {
        addQueueItem() {
            const queueItem = {
                roomId: this.room.id,
                contentUri: 'magnit', // what we're all here for

                // computed client side. do we even want to accept this?
                // we'll need to revalidate for each client anyways.
                duration: 201, // 3m 21s
                filesize: 1024*1024*3, // 3MiB
                title: 'dat #1 luvsong~',
                artist: 'u know deez bois deez bois know u',
            };
            this.$store.serverTx('addQueueItem', {queueItem});
        }
    }
}
</script>

<style scoped>
</style>
