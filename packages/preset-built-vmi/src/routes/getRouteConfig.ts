import type { IApi, IRoute } from '@umijs/types';
import { createDebug } from '@umijs/utils';
import fs from 'fs';
import path from 'path';
//@ts-ignore
import slash from 'slash2';
import type { IDumiOpts } from '../index';
import getRouteConfigFromDir from './getRouteConfigFromDir';

const debug = createDebug('vmi:routes:get');

export default async (api: IApi, opts: IDumiOpts): Promise<IRoute[]> => {
  const { paths } = api;
  const config: IRoute[] = [];
  const childRoutes: IRoute[] = [];
  const userRoutes = api.userConfig.routes;

  if (userRoutes) {
    // only apply user's routes if there has routes config
    childRoutes.push(
      //@ts-ignore
      ...userRoutes.map(({ component, ...routeOpts }) => ({
        component: path.isAbsolute(component as string)
          ? slash(path.relative(paths.cwd || '', component))
          : component,
        ...routeOpts,
      })),
    );
    debug('getRouteConfigFromUserConfig');
  } else {
    // generate routes automatically if there has no routes config
    // find routes from include path & find examples from example path

    if (paths.absPagesPath) {
      if (
        fs.existsSync(paths.absPagesPath) &&
        fs.statSync(paths.absPagesPath).isDirectory()
      ) {
        debug('Generating routes...');

        childRoutes.push(
          ...(await getRouteConfigFromDir(
            path.relative(
              paths.absSrcPath as string,
              paths.absPagesPath as string,
            ),
            opts,
          )),
        );
      }
    }

    debug('getRouteConfigFromDir');
  }

  // add main routes
  config.push(...childRoutes);
  debug('decorateRoutes');

  return config;
};
