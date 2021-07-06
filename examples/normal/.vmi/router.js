import { createRouter, createWebHistory } from "vue-router";
import { normalizeURL } from "@nuxt/ufo";
import { interopDefault } from "./utils";
import scrollBehavior from "./router.scrollBehavior.js";

const Home = () =>
  interopDefault(
    import("../pages/Home.vue" /* webpackChunkName: "pages/Home" */)
  );

const User = () =>
  interopDefault(
    import("../pages/User.vue" /* webpackChunkName: "pages/User" */)
  );

export const routerOptions = {
  history: createWebHistory("/"),
  base: "/",
  linkActiveClass: "nuxt-link-active",
  linkExactActiveClass: "nuxt-link-exact-active",
  scrollBehavior,
  routes: [
    {
      path: "/",
      name: "home ",
      components: { default: Home },
      meta: { title: "首页" },
    },
    {
      path: "/user",
      name: "user ",
      components: { default: User },
      meta: { title: "用户" },
    },
  ],
  fallback: false,
};

function decodeObj(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = decodeURIComponent(obj[key]);
    }
  }
}

export function createRouterNuxt() {
  const router = createRouter(routerOptions);
  const resolve = router.resolve.bind(router);
  router.resolve = (to, current, append) => {
    if (typeof to === "string") {
      to = normalizeURL(to);
    }
    const r = resolve(to, current, append);
    if (r && r.resolved && r.resolved.query) {
      decodeObj(r.resolved.query);
    }
    return r;
  };
  return router;
}
