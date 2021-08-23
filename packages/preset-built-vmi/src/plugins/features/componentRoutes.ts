//@ts-ignore
import { createRoutes } from '@nuxt/utils';
import type { IApi, IRoute } from '@umijs/types';
import fs, { constants } from 'fs';
import path from 'path';

/**
 * plugin for generate component routes
 */
export default (api: IApi) => {
  // generate vmi component  routes
  api.onPatchRoutesBefore(async ({ routes, parentRoute }) => {
    // only deal with the top level routes
    if (!parentRoute) {
      // get root index.js/index.vue
      const files = {};
      const supportedExtensions = ['vue', 'js', 'jsx'];
      const ext = new RegExp(`\\.(${supportedExtensions.join('|')})$`);

      let rootIndex = [];
      try {
        fs.accessSync(path.resolve(api.cwd, 'index.js'), constants.R_OK);
        rootIndex.push(path.resolve(api.cwd, 'index.js'));
        fs.accessSync(path.resolve(api.cwd, 'index.vue'), constants.R_OK);
        rootIndex.push(path.resolve(api.cwd, 'index.vue'));
      } catch (error) {}

      if (!rootIndex.length) return;

      for (const page of rootIndex) {
        const key = page.replace(ext, '');
        // .vue file takes precedence over other extensions
        if (/\.vue$/.test(page) || !files[key]) {
          files[key] = page.replace(/(['"])/g, '\\$1');
        }
      }

      const route: IRoute[] = createRoutes({
        files: Object.values(files),
        srcDir: api.paths.cwd,
        pagesDir: api.paths.cwd,
        routeNameSplitter: '-',
        supportedExtensions: ['vue', 'js', 'jsx'],
        undefined,
      });

      // unshit docs routes in integrate mode
      routes.unshift(...route);
    }
  });
};
