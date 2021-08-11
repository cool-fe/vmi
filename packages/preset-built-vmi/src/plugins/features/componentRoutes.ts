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
      let rootIndex;
      try {
        fs.accessSync(path.resolve(api.cwd, 'index.js'), constants.R_OK);
        rootIndex = path.resolve(api.cwd, 'index.js');
        fs.accessSync(path.resolve(api.cwd, 'index.vue'), constants.R_OK);
        rootIndex = path.resolve(api.cwd, 'index.vue');
      } catch (error) {}

      if (!rootIndex) return;

      const route: IRoute[] = createRoutes({
        files: ['/' + path.basename(rootIndex)],
        srcDir: api.paths.absSrcPath,
        pagesDir: api.paths.absSrcPath,
        routeNameSplitter: '-',
        supportedExtensions: ['vue', 'js', 'jsx'],
        undefined,
      });
      // unshit docs routes in integrate mode
      routes.unshift(...route);
    }
  });
};
