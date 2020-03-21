<template>
    <div>
        <h3>Welcome to {{room.name}}, {{userName}} (room {{room.id}})</h3>
        <Occupants></Occupants>
        <hr>
        <Torrents></Torrents>
        <hr>
        <Queue></Queue>
    </div>
</template>

<script>
import Occupants from './Occupants.vue';
import Queue from './Queue.vue';
import Torrents from './Torrents.vue';

export default {
    components: {Occupants, Queue, Torrents},
    computed: {
        userName() {
            return this.$store.state.server.whoami.name;
        },
        room() {
            return this.$store.state.server.room;
        },
    },
}
</script>

<style scoped>
</style>
