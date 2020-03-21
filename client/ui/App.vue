<template>
    <Login v-if='isAnon'></Login>
    <Room v-else-if='room.id'></Room>
    <Lobby v-else></Lobby>
</template>

<script>
import Lobby from './flow/Lobby.vue';
import Login from './flow/Login.vue';
import Room from './flow/Room.vue';

export default {
    components: { Lobby, Login, Room },
    computed: {
        isAnon() {
            return !this.$store.state.server.whoami.id;
        },
        room() {
            return this.$store.state.server.room;
        },
    },
}
</script>
