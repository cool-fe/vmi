/* eslint-disable no-debugger */
import { h, resolveComponent } from 'vue';

export default {
  name: 'NuxtLink',
  render() {
    return h(resolveComponent('RouterLink'), null, this.$slots.default());
  },
  mounted() {},
};
