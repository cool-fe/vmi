/* eslint-disable no-debugger */
import Vue, { createApp, nextTick, unref } from "vue";
import middleware from "./middleware";

import {
  getMatchedComponents,
  getMatchedComponentsInstances,
  flatMapComponents,
  setContext,
  getQueryDiff,
  globalHandleError,
} from "./utils.js";

import { createNuxtApp } from "./index.js";
import NuxtLink from "./components/nuxt-link.client.js"; // should be included after ./index.js
import NuxtChild from "./components/nuxt-child.js";
import Nuxt from "./components/nuxt.js";
import NuxtError from "../layouts/error.vue";

function registerComponents(_app) {
  _app.component(NuxtChild.name, NuxtChild);
  _app.component(Nuxt.name, Nuxt);
  _app.component(NuxtLink.name, NuxtLink);
}

function setHandlerError(_app) {
  // Setup global Vue error handler
  if (!_app.config.$nuxt) {
    const defaultErrorHandler = _app.config.errorHandler;
    _app.config.errorHandler = async (err, vm, info, ...rest) => {
      // Call other handler if exist
      let handled = null;
      if (typeof defaultErrorHandler === "function") {
        handled = defaultErrorHandler(err, vm, info, ...rest);
      }
      if (handled === true) {
        return handled;
      }

      // if (vm && vm.$root) {
      //   const nuxtApp = Object.keys(_app.config.$nuxt).find(
      //     (nuxtInstance) => vm.$root[nuxtInstance]
      //   );

      //   // Show Nuxt Error Page
      //   if (nuxtApp && vm.$root[nuxtApp].error && info !== "render function") {
      //     const currentApp = vm.$root[nuxtApp];

      //     // Load error layout
      //     let layout = (NuxtError.options || NuxtError).layout;
      //     if (typeof layout === "function") {
      //       layout = layout(currentApp.context);
      //     }
      //     if (layout) {
      //       await currentApp.loadLayout(layout).catch(() => {});
      //     }
      //     currentApp.setLayout(layout);

      //     currentApp.error(err);
      //   }
      // }

      if (typeof defaultErrorHandler === "function") {
        return handled;
      }

      // Log to console
      if (process.env.NODE_ENV !== "production") {
        console.error(err);
      } else {
        console.error(err.message || err);
      }
    };
    _app.config.$nuxt = {};
  }
  _app.config.$nuxt.$nuxt = true;
}

let app;
let router;
let store;
let rootComponent;

const NUXT = window.context || {};
const errorHandler = console.error;

createNuxtApp(null, NUXT.config)
  .then(mountApp)
  .catch(errorHandler);

async function loadAsyncComponents(to, from, next) {
  this._routeChanged = Boolean(app.nuxt.err) || from.name !== to.name;
  this._paramChanged = !this._routeChanged && from.path !== to.path;
  this._queryChanged = !this._paramChanged && from.fullPath !== to.fullPath;
  this._diffQuery = this._queryChanged
    ? getQueryDiff(to.query, from.query)
    : [];

  try {
    // Call next()
    next();
  } catch (error) {
    const err = error || {};
    const statusCode =
      err.statusCode ||
      err.status ||
      (err.response && err.response.status) ||
      500;
    const message = err.message || "";

    if (/^Loading( CSS)? chunk (\d)+ failed\./.test(message)) {
      window.location.reload(true);
      return;
    }

    this.error({ statusCode, message });
    // this.nuxt.$emit("routeChanged", to, from, err);
    next();
  }
}

// 调用middleware
function callMiddleware(Components, context, layout) {
  let midd = ["auth"];
  let unknownMiddleware = false;

  // If layout is undefined, only call global middleware
  if (typeof layout !== "undefined") {
    midd = []; // Exclude global middleware if layout defined (already called before)
    layout = sanitizeComponent(layout);
    if (layout.middleware) {
      midd = midd.concat(layout.middleware);
    }
    Components.forEach((Component) => {
      if (Component.middleware) {
        midd = midd.concat(Component.middleware);
      }
    });
  }

  midd = midd.map((name) => {
    if (typeof name === "function") {
      return name;
    }
    if (typeof middleware[name] !== "function") {
      unknownMiddleware = true;
      this.error({ statusCode: 500, message: "Unknown middleware " + name });
    }
    return middleware[name];
  });

  if (unknownMiddleware) {
    return;
  }
  return middlewareSeries(midd, context);
}

async function render(to, from, next) {
  if (
    this._routeChanged === false &&
    this._paramChanged === false &&
    this._queryChanged === false
  ) {
    return next();
  }

  let nextCalled = false;
  const _next = (path) => {
    if (nextCalled) {
      return;
    }

    nextCalled = true;
    next(path);
  };

  // Update context
  await setContext(app, {
    route: to,
    from,
    next: _next.bind(this),
  });

  this._dateLastError = app.nuxt.dateErr;
  this._hadError = Boolean(app.nuxt.err);

  // Get route's matched components
  const matches = [];
  const Components = getMatchedComponents(to, matches);

  // If no Components matched, generate 404
  if (!Components.length) {
    await callMiddleware.call(this, Components, app.context);
    if (nextCalled) {
      return;
    }

    // Load layout for error page
    const errorLayout = (NuxtError.options || NuxtError).layout;
    const layout = await this._component.methods.loadLayout(
      typeof errorLayout === "function"
        ? errorLayout.call(NuxtError, app.context)
        : errorLayout
    );

    await callMiddleware.call(this, Components, app.context, layout);
    if (nextCalled) {
      return;
    }

    // Show error page
    app.context.error({
      statusCode: 404,
      message: "messages.error_404",
    });
    return next();
  }

  try {
    // Call middleware
    await callMiddleware.call(this, Components, app.context);
    if (nextCalled) {
      return;
    }
    if (app.context._errored) {
      return next();
    }
    // Set layout
    let layout = Components[0].layout;
    if (typeof layout === "function") {
      layout = layout(app.context);
    }
    layout = await this._component.methods.loadLayout(layout);
    console.log("render loadLayout===", layout);

    // Call middleware for layout
    await callMiddleware.call(this, Components, app.context, layout);
    if (nextCalled) {
      return;
    }
    if (app.context._errored) {
      return next();
    }

    // If not redirected
    if (!nextCalled) {
      next();
    }
  } catch (err) {
    const error = err || {};
    if (error.message === "ERR_REDIRECT") {
      // return this.nuxt.$emit("routeChanged", to, from, error);
    }
    globalHandleError(this, error);
    // this.nuxt.$emit("routeChanged", to, from, error);
    next();
  }
}

// Fix components format in matched, it's due to code-splitting of vue-router
function normalizeComponents(to) {
  flatMapComponents(to, (Component, _, match, key) => {
    if (typeof Component === "object" && !Component) {
      // Updated via vue-router resolveAsyncComponents()
      Component._Ctor = Component;
      match.components[key] = Component;
    }
    return Component;
  });
}

function setLayoutForNextPage(to) {
  // Set layout
  // let hasError = Boolean(this.$options.nuxt.err);
  // if (this._hadError && this._dateLastError === this.$options.nuxt.dateErr) {
  //   hasError = false;
  // }
  // let layout = hasError
  //   ? (NuxtError.options || NuxtError).layout
  //   : to.matched[0].components.default.options.layout;

  let layout = unref(to).matched[0].components.default.layout;

  if (typeof layout === "function") {
    layout = layout(app.context);
  }

  if (layout && typeof layout !== "string") {
    throw new Error("[nuxt] Avoid using non-string value as layout property.");
  }

  if (!layout) {
    layout = "default";
  }

  this.provide("layoutName", "_" + layout);
}

function checkForErrors(app) {
  // Hide error component if no error
  if (app._hadError && app._dateLastError === app.$options.nuxt.dateErr) {
    app.error();
  }
}
// When navigating on a different route but the same component is used, Vue.js
// Will not update the instance data, so we have to update $data ourselves
function fixPrepatch(to) {
  if (
    this._routeChanged === false &&
    this._paramChanged === false &&
    this._queryChanged === false
  ) {
    return;
  }

  const instances = getMatchedComponentsInstances(to);
  const Components = getMatchedComponents(to);

  let triggerScroll = "true";

  nextTick(() => {
    instances.forEach((instance, i) => {
      if (!instance || instance._isDestroyed) {
        return;
      }

      if (
        instance.constructor._dataRefresh &&
        Components[i] === instance.constructor &&
        instance.$vnode.data.keepAlive !== true &&
        typeof instance.constructor.options.data === "function"
      ) {
        const newData = instance.constructor.options.data.call(instance);
        for (const key in newData) {
          Vue.set(instance.$data, key, newData[key]);
        }

        triggerScroll = true;
      }
    });

    if (triggerScroll) {
      // Ensure to trigger scroll event after calling scrollBehavior
      nextTick(() => {
        window.nuxt.$emit("triggerScroll");
      });
    }

    checkForErrors(this);
  });
}

function nuxtReady(_app) {
  window.onNuxtReadyCbs.forEach((cb) => {
    if (typeof cb === "function") {
      cb(_app);
    }
  });
  // Special JSDOM
  if (typeof window._onNuxtLoaded === "function") {
    window._onNuxtLoaded(_app);
  }
  // Add router hooks
  router.afterEach((to, from) => {
    // Wait for fixPrepatch + $data updates
    // nextTick(() => _app.nuxt.$emit("routeChanged", to, from));
  });
}

async function mountApp(__app) {
  // Set global variables
  app = __app.app;
  router = __app.router;
  store = __app.store;

  // Create Vue instance
  const _app = createApp(app);

  _app.use(router);
  _app.use(store);

  registerComponents(_app);
  setHandlerError(_app);

  // Mounts Vue app to DOM element
  const mount = () => {
    debugger;
    rootComponent = _app.mount("#__nuxt");
    Object.defineProperty(_app.config.globalProperties, "$nuxt", {
      get() {
        debugger;
        return rootComponent.$nuxt;
      },
      configurable: true,
    });
    // Add afterEach router hooks
    router.afterEach(normalizeComponents);
    router.afterEach(setLayoutForNextPage.bind(_app));
    router.afterEach(fixPrepatch.bind(_app));

    // Listen for first Vue update
    nextTick(() => {
      // Call window.{{globals.readyCallback}} callbacks
      nuxtReady(_app);
    });
  };

  router.beforeEach(loadAsyncComponents.bind(_app));
  router.beforeEach(render.bind(_app));

  // First render on client-side
  const clientFirstMount = () => {
    normalizeComponents(router.currentRoute, router.currentRoute);
    setLayoutForNextPage.call(_app, router.currentRoute);
    checkForErrors(_app);
    mount();
  };

  // fix: force next tick to avoid having same timestamp when an error happen on spa fallback
  await new Promise((resolve) => setTimeout(resolve, 0));

  render.call(_app, router.currentRoute, router.currentRoute, (path) => {
    // If not redirected
    if (!path) {
      clientFirstMount();
      return;
    }

    // Add a one-time afterEach hook to
    // mount the app wait for redirect and route gets resolved
    const unregisterHook = router.afterEach(() => {
      unregisterHook();
      clientFirstMount();
    });

    // Push the path and let route to be resolved
    router.push(path, undefined, (err) => {
      if (err) {
        errorHandler(err);
      }
    });
  });
}
