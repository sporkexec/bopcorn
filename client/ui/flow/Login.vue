<template>
    <div>
        Login (TBD)
        <hr/>
        or choose a name:
        <input v-model="name" placeholder="Guest">
        <button @click="register">That's my handle</button>
    </div>
</template>

<script>
export default {
    data: _ => ({name: ''}),
    methods: {
        register() {
            this.$store.serverTx('registerGuest', {name: this.name});
        }
    }
}
</script>

<style scoped>
</style>
