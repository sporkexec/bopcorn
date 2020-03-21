<template>
    <div>
        <b>We got the whole gang here:</b><br>
        <ul>
            <li v-for="occupant in occupants" :key="occupant.userId">
                {{occupant.name}} (id {{occupant.userId}})
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    computed: {
        occupants() {
            return this.$store.state.server.roomOccupants;
        },
    },
}
</script>

<style scoped>
</style>
