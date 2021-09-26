import { getRouteBase, getRoutes } from '@@/core/routes';
import { normalizeURL } from 'ufo';
import Vue from 'vue';
import Router from 'vue-router';
import scrollBehavior from './router.scrollBehavior.js';

const emptyFn = () => {};

Vue.use(Router);

export const routerOptions = {
  mode: 'history',
  base: getRouteBase() || '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,
  routes: getRoutes(),
  fallback: false,
};

export function createRouter(ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base;
  const router = new Router({ ...routerOptions, base });

  // TODO: remove in Nuxt 3
  const originalPush = router.push;
  router.push = function push(location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort);
  };

  const resolve = router.resolve.bind(router);
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to);
    }
    return resolve(to, current, append);
  };

  return router;
}
