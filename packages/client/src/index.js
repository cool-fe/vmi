import { plugin } from '@@/core/plugin';
import { ApplyPluginsType } from '@@/core/umiExports';
import Vue from 'vue';
import App from './App.js';
import NuxtError from './components/nuxt-error.vue';
import { createRouter } from './router.js';
import { getLocation, getRouteData, normalizeError, setContext } from './utils';

plugin.applyPlugins({
  key: 'enhanceApp',
  type: ApplyPluginsType.event,
  args: { Vue },
});

plugin.applyPlugins({
  key: 'default',
  type: ApplyPluginsType.event,
  args: { Vue },
});

Object.defineProperty(Vue.prototype, '$nuxt', {
  get() {
    const globalNuxt = this.$root.$options.$nuxt;
    if (process.client && !globalNuxt && typeof window !== 'undefined') {
      return window.$nuxt;
    }
    return globalNuxt;
  },
  configurable: true,
});

async function createApp(ssrContext, config = {}) {
  const router = await createRouter(ssrContext, config);

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = {
    head: {
      title: 'vmi',
      htmlAttrs: { lang: 'zh-cn' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: '' },
      ],
      link: [
        { rel: 'icon', type: 'image\u002Fx-icon', href: '\u002Ffavicon.ico' },
      ],
      style: [],
      script: [],
    },

    router,
    nuxt: {
      err: null,
      dateErr: null,
      error(err) {
        err = err || null;
        app.context._errored = Boolean(err);
        err = err ? normalizeError(err) : null;
        let nuxt = app.nuxt; // to work with @vue/composition-api, see https://github.com/nuxt/nuxt.js/issues/6517#issuecomment-573280207
        if (this) {
          nuxt = this.nuxt || this.$options.nuxt;
        }
        nuxt.dateErr = Date.now();
        nuxt.err = err;
        // Used in src/server.js
        if (ssrContext) {
          ssrContext.nuxt.error = err;
        }
        return err;
      },
    },
    ...App,
  };

  const next = (location) => app.router.push(location);
  
  // Resolve route
  const path = getLocation(router.options.base, router.options.mode);
  const route = router.resolve(path).route;

  // Set context to app.context
  await setContext(app, {
    route,
    next,
    error: app.nuxt.error.bind(app),
  });

  // Wait for async component to be resolved first
  await new Promise((resolve, reject) => {
    const { route } = router.resolve(app.context.route.fullPath);
    // Ignore 404s rather than blindly replacing URL
    if (!route.matched.length && process.client) {
      return resolve();
    }
    router.replace(route, resolve, (err) => {
      // https://github.com/vuejs/vue-router/blob/v3.4.3/src/util/errors.js
      if (!err._isRouter) return reject(err);
      if (err.type !== 2 /* NavigationFailureType.redirected */)
        return resolve();

      // navigated to a different route in router guard
      const unregister = router.afterEach(async (to, from) => {
        app.context.route = await getRouteData(to);
        app.context.params = to.params || {};
        app.context.query = to.query || {};
        unregister();
        resolve();
      });
    });
  });

  return {
    app,
    router,
  };
}

export { createApp, NuxtError };
