/* eslint-disable no-debugger */
import { createStore } from "vuex";

const VUEX_PROPERTIES = ["state", "getters", "actions", "mutations"];

let store = {};

(function updateModules() {
  if (typeof store === "function") {
    return console.warn(
      "Classic mode for store/ is deprecated and will be removed in Nuxt 3."
    );
  }
  store.modules = store.modules || {};
  resolveStoreModules(require("../store/user.js"), "user.js");
})();

export const createStoreNuxt = () => createStore(store);

function normalizeModule(moduleData, filePath) {
  if (moduleData.state && typeof moduleData.state !== "function") {
    console.warn(
      `'state' should be a method that returns an object in ${filePath}`
    );

    const state = Object.assign({}, moduleData.state);
    // Avoid TypeError: setting a property that has only a getter when overwriting top level keys
    moduleData = Object.assign({}, moduleData, { state: () => state });
  }
  return moduleData;
}

function resolveStoreModules(moduleData, filename) {
  moduleData = moduleData.default || moduleData;
  // Remove store src + extension (./foo/index.js -> foo/index)
  const namespace = filename.replace(/\.(js|mjs)$/, "");
  const namespaces = namespace.split("/");
  let moduleName = namespaces[namespaces.length - 1];
  const filePath = `store/${filename}`;

  moduleData =
    moduleName === "state"
      ? normalizeState(moduleData, filePath)
      : normalizeModule(moduleData, filePath);

  // If src is a known Vuex property
  if (VUEX_PROPERTIES.includes(moduleName)) {
    const property = moduleName;
    const propertyStoreModule = getStoreModule(store, namespaces, {
      isProperty: true,
    });

    // Replace state since it's a function
    mergeProperty(propertyStoreModule, moduleData, property);
    return;
  }

  // If file is foo/index.js, it should be saved as foo
  const isIndexModule = moduleName === "index";
  if (isIndexModule) {
    namespaces.pop();
    moduleName = namespaces[namespaces.length - 1];
  }

  const storeModule = getStoreModule(store, namespaces);

  for (const property of VUEX_PROPERTIES) {
    mergeProperty(storeModule, moduleData[property], property);
  }

  if (moduleData.namespaced === false) {
    delete storeModule.namespaced;
  }
}

function normalizeState(moduleData, filePath) {
  if (typeof moduleData !== "function") {
    console.warn(`${filePath} should export a method that returns an object`);
    const state = Object.assign({}, moduleData);
    return () => state;
  }
  return normalizeModule(moduleData, filePath);
}

function getStoreModule(storeModule, namespaces, { isProperty = false } = {}) {
  // If ./mutations.js
  if (!namespaces.length || (isProperty && namespaces.length === 1)) {
    return storeModule;
  }

  const namespace = namespaces.shift();

  storeModule.modules[namespace] = storeModule.modules[namespace] || {};
  storeModule.modules[namespace].namespaced = true;
  storeModule.modules[namespace].modules =
    storeModule.modules[namespace].modules || {};

  return getStoreModule(storeModule.modules[namespace], namespaces, {
    isProperty,
  });
}

function mergeProperty(storeModule, moduleData, property) {
  if (!moduleData) {
    return;
  }

  if (property === "state") {
    storeModule.state = moduleData || storeModule.state;
  } else {
    storeModule[property] = Object.assign(
      {},
      storeModule[property],
      moduleData
    );
  }
}
