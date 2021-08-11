import type { IApi } from '@umijs/types';
import ctx from '../../context';
import getRouteConfig from '../../routes/getRouteConfig';

/**
 * plugin for generate routes
 */
export default (api: IApi) => {
  // generate docs routes
  api.onPatchRoutesBefore(async ({ routes, parentRoute }) => {
    // only deal with the top level routes
    if (!parentRoute) {
      //@ts-ignore
      const result = await getRouteConfig(api, ctx.opts);

      if (ctx.opts?.isIntegrate) {
        // unshit docs routes in integrate mode
        routes.unshift(...result);
      } else {
        // clear original routes
        routes.splice(0, routes.length);

        // append new routes
        routes.push(...result);
      }
    }
  });
};
