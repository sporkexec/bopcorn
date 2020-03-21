<template>
    <div>
        <h3>oh hi, {{name}}</h3>
        <button @click="register">Make me a guest</button>
    </div>
</template>

<script>
export default {
    computed: {
        name() {
            const whoami = this.$store.state.server.whoami;
            return whoami.name || 'Anonymous';
        },
    },
    methods: {
        register() {
            const name = 'noot-noot king';
            this.$store.serverTx('registerGuest', {name});
        }
    }
}
</script>

<style scoped>
</style>
