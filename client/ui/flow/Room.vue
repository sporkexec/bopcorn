<template>
    <div>
        <h3>Welcome to {{room.name}}, {{userName}} ({{room.id}})</h3>
        <div>
            <b>We got the whole gang here:</b>
            {{occupants}}
        </div>
    </div>
</template>

<script>
export default {
    methods: {
    },
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
    },
}
</script>

<style scoped>
</style>
