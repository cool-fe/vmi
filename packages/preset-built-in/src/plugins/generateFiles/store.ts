import { readFileSync } from 'fs';
import { join } from 'path';
import { IApi } from '@umijs/types';
import { Route } from '@umijs/core';
import { runtimePath } from './constants';

export default function (api: IApi) {
  const {
    cwd,
    utils: { Mustache },
  } = api;

  api.onGenerateFiles(async (args) => {
    const routesTpl = readFileSync(join(__dirname, 'store.tpl'), 'utf-8');
    const routes = await api.getRoutes();
    api.writeTmpFile({
      path: 'store.js',
      content: Mustache.render(routesTpl, {
        routes: new Route().getJSON({ routes, config: api.config, cwd }),
        runtimePath,
        config: api.config,
        loadingComponent: api.config.dynamicImport?.loading,
      }),
    });
  });
}
