import { createRouterNuxt } from "./router.js";
import { createStoreNuxt } from "./store.js";

import App from "./App.js";
import { setContext, getLocation, getRouteData, normalizeError } from "./utils";

// import nuxt_plugin_axios_41871259 from "nuxt_plugin_axios_41871259"; // Source: ./nuxt-axios/axios.js (mode: 'client')

async function createNuxtApp(ssrContext, config = {}) {
  const router = await createRouterNuxt(ssrContext);
  const store = await createStoreNuxt();
  store.$router = router;

  const app = {
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

  store.app = app;

  const next = ssrContext
    ? ssrContext.next
    : (location) => app.router.push(location);
  // Resolve route
  let route;
  if (ssrContext) {
    route = router.resolve(ssrContext.url).route;
  } else {
    const path = getLocation(router.options.base, router.options.history);
    route = router.resolve(path);
  }

  // Set context to app.context
  await setContext(app, {
    route,
    store,
    next,
    error: app.nuxt.error.bind(app),
    payload: ssrContext ? ssrContext.payload : undefined,
    req: ssrContext ? ssrContext.req : undefined,
    res: ssrContext ? ssrContext.res : undefined,
    beforeRenderFns: ssrContext ? ssrContext.beforeRenderFns : undefined,
    ssrContext,
  });

  function inject(key, value) {
    if (!key) {
      throw new Error("inject(key, value) has no key provided");
    }
    if (value === undefined) {
      throw new Error(`inject('${key}', value) has no value provided`);
    }

    key = "$" + key;
    // Add into app
    app[key] = value;
    // Add into context
    if (!app.context[key]) {
      app.context[key] = value;
    }
  }

  // Inject runtime config as $config
  inject("config", config);

  // Add enablePreview(previewData = {}) in context for plugins
  if (process.static && process.client) {
    app.context.enablePreview = function(previewData = {}) {
      app.previewData = Object.assign({}, previewData);
      inject("preview", previewData);
    };
  }

  //apply plugin
  // if (typeof nuxt_plugin_axios_41871259 === 'function') {
  //   await nuxt_plugin_axios_41871259(app.context, inject)
  // }

  if (process.static && process.client) {
    app.context.enablePreview = function() {
      console.warn("You cannot call enablePreview() outside a plugin.");
    };
  }

  // If server-side, wait for async component to be resolved first
  if (process.server && ssrContext && ssrContext.url) {
    await new Promise((resolve, reject) => {
      router.push(ssrContext.url, resolve, (err) => {
        // https://github.com/vuejs/vue-router/blob/v3.4.3/src/util/errors.js
        if (!err._isRouter) return reject(err);
        if (err.type !== 2 /* NavigationFailureType.redirected */)
          return resolve();

        // navigated to a different route in router guard
        const unregister = router.afterEach(async (to) => {
          ssrContext.url = to.fullPath;
          app.context.route = await getRouteData(to);
          app.context.params = to.params || {};
          app.context.query = to.query || {};
          unregister();
          resolve();
        });
      });
    });
  }

  return {
    store,
    app,
    router,
  };
}

export { createNuxtApp, createRouterNuxt };
