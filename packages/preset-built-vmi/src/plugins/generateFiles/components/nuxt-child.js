import { h, resolveComponent } from 'vue';

export default {
  name: 'NuxtChild',
  functional: true,
  props: {
    nuxtChildKey: {
      type: String,
      default: '',
    },
    keepAlive: Boolean,
    keepAliveProps: {
      type: Object,
      default: undefined,
    },
  },
  render() {
    let routerView = h(resolveComponent('routerView'), this.$props);
    if (this.$props.keepAlive) {
      routerView = h(
        resolveComponent('keep-alive'),
        ...this.$props.keepAliveProps,
        [routerView],
      );
    }
    return routerView;
  },
};
