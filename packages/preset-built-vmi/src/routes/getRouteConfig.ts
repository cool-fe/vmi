import fs from 'fs';
import path from 'path';
//@ts-ignore
import slash from 'slash2';
import type { IApi, IRoute } from '@umijs/types';
import { createDebug } from '@umijs/utils';
import getRouteConfigFromDir from './getRouteConfigFromDir';
import type { IDumiOpts } from '../index';

const debug = createDebug('dumi:routes:get');

export const DUMI_ROOT_FLAG = '__dumiRoot';

export default async (api: IApi, opts: IDumiOpts): Promise<IRoute[]> => {
  const { paths } = api;
  const config: IRoute[] = [];
  const childRoutes: IRoute[] = [];
  const userRoutes =
    opts.isIntegrate || api.args?.dumi !== undefined
      ? (
          await api.applyPlugins({
            key: 'dumi.getRootRoute',
            type: api.ApplyPluginsType.modify,
            initialValue: api.userConfig.routes,
          })
        )?.routes
      : api.userConfig.routes;

  if (userRoutes) {
    // only apply user's routes if there has routes config
    childRoutes.push(
      ...userRoutes.map(({ component, ...routeOpts }) => ({
        component: path.isAbsolute(component as string)
          ? slash(path.relative(paths.cwd, component))
          : component,
        ...routeOpts,
      })),
    );
    debug('getRouteConfigFromUserConfig');
  } else {
    // generate routes automatically if there has no routes config
    // find routes from include path & find examples from example path

    for (const item of [
      path.resolve(paths.cwd as string, 'src'),
      path.resolve(paths.cwd as string, 'pages'),
    ]) {
      const docsPath = path.isAbsolute(item)
        ? item
        : path.join(paths.cwd as string, item);

      if (fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory()) {
        debug('Generating routes...');
        childRoutes.push(...(await getRouteConfigFromDir(docsPath, opts)));
      }
    }

    debug('getRouteConfigFromDir');
  }

  // add main routes
  config.push(...childRoutes);
  debug('decorateRoutes');

  return config;
};
