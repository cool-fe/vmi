<template>
  <div>header</div>
  <div class="content">
    <Nuxt />
  </div>
  <div>footer</div>
</template>

<script>
export default {
  data() {
    return {
      drawer: true,
    };
  },
  head: {
    title: "Nuxt Vuetify Starter",
  },
  mounted() {
    debugger;
  },
};
</script>

<style scoped>
</style>
