<template>
    <div>
        <h3>Welcome {{userName}}</h3>
        Create a room:
        <input v-model="newRoomName" placeholder="Bobby's Birdhouse">
        <button @click="createRoom">make it yours</button>
        <hr>
        Join a room (by id pls):
        <input v-model.number="joinRoomId">
        <button @click="joinRoom">git in here sucker</button>
    </div>
</template>

<script>
export default {
    data: _ => ({
        newRoomName: '',
        joinRoomId: '',
    }),
    methods: {
        createRoom() {
            this.$store.serverTx('createRoom', {name: this.newRoomName});
        },
        joinRoom() {
            this.$store.serverTx('joinRoom', {roomId: this.joinRoomId});
        },
    },
    computed: {
        userName() {
            return this.$store.state.server.whoami.name;
        },
    },
}
</script>

<style scoped>
</style>
