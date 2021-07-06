import { h, resolveComponent, reactive } from "vue";
import NuxtLoading from "./components/nuxt-loading.vue";
import NuxtError from "../layouts/error.vue";
import { sanitizeComponent } from "./utils";

import _6f6c098b from "./layouts/default.vue";
const layouts = { _default: sanitizeComponent(_6f6c098b) };

export default {
  name: "App",
  inject: ["layoutName"],
  render() {
    const loadingEl = h(resolveComponent("NuxtLoading"), { ref: "loading" });
    const layoutEl = h(layouts[this.layout || this.layoutName] || "nuxt");
    return h(
      "div",
      {
        id: "nuxt_div",
        emits: {},
        onClick: () => {
          this.nuxt.err = "ce";
        },
      },
      [loadingEl, layoutEl]
    );
  },
  data: () => ({
    layout: null,
  }),

  beforeCreate() {
    this.nuxt = reactive(this.$options.nuxt);
  },
  created() {
    this.$root.$options.nuxt = this;
    this.error = this.nuxt.error;
    this.context = this.nuxt.context;
  },
  watch: {
    "nuxt.err": "errorChanged",
  },
  methods: {
    errorChanged() {
      if (this.nuxt.err) {
        if (this.$loading) {
          if (this.$loading.fail) {
            this.$loading.fail(this.nuxt.err);
          }
          if (this.$loading.finish) {
            this.$loading.finish();
          }
        }

        let errorLayout = NuxtError.layout;

        if (typeof errorLayout === "function") {
          errorLayout = errorLayout(this.context);
        }

        this.layout = "_default";
      }
    },
    loadLayout(layout) {
      if (!layout || !layouts["_" + layout]) {
        layout = "default";
      }
      return Promise.resolve(layouts["_" + layout]);
    },
  },
  components: {
    NuxtLoading,
  },
};
