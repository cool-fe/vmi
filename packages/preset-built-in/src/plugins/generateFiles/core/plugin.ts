import { IApi } from '@umijs/types';
import { getFile, winPath } from '@umijs/utils';
import { readFileSync } from 'fs';
import { join } from 'path';
import { runtimePath } from '../constants';

export default function (api: IApi) {
  const {
    paths,
    utils: { Mustache },
  } = api;

  api.onGenerateFiles(async (args) => {
    const validKeys = await api.applyPlugins({
      key: 'addRuntimePluginKey',
      type: api.ApplyPluginsType.add,
      initialValue: [
        'patchRoutes',
        'render',
        'onRouteChange',
        'default',
        'enhanceApp',
      ],
    });

    let srcIndex = getFile({
      base: paths.absSrcPath!,
      fileNameWithoutExt: 'app',
      type: 'javascript',
    })?.path;

    if (!srcIndex) {
      srcIndex = getFile({
        base: paths.cwd!,
        fileNameWithoutExt: 'app',
        type: 'javascript',
      })?.path;
      if (srcIndex) {
        api.logger.warn('项目根目录的 app.js 被移动到 src/app.js');
      }
    }

    const plugins = await api.applyPlugins({
      key: 'addRuntimePlugin',
      type: api.ApplyPluginsType.add,
      initialValue: [srcIndex].filter(Boolean),
    });
    api.writeTmpFile({
      path: 'core/plugin.ts',
      content: Mustache.render(
        readFileSync(join(__dirname, 'plugin.tpl'), 'utf-8'),
        {
          validKeys,
          runtimePath,
        },
      ),
    });
    api.writeTmpFile({
      path: 'core/pluginRegister.ts',
      content: Mustache.render(
        readFileSync(join(__dirname, 'pluginRegister.tpl'), 'utf-8'),
        {
          plugins: plugins.map((plugin: string, index: number) => {
            return {
              index,
              path: winPath(plugin),
            };
          }),
        },
      ),
    });
  });

  api.addUmiExports(() => {
    return {
      specifiers: ['plugin'],
      source: `./plugin`,
    };
  });

  api.addUmiExports(() => {
    return {
      specifiers: ['ApplyPluginsType'],
      source: `${runtimePath}`,
    };
  });
}
