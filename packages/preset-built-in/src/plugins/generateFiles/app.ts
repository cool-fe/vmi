import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { IApi } from '@umijs/types';
import { winPath } from '@umijs/utils';

export default function (api: IApi) {
  const {
    utils: { Mustache },
  } = api;

  api.onGenerateFiles(async (args) => {
    const umiTpl = readFileSync(join(__dirname, 'App.tpl'), 'utf-8');
    const rendererPath = await api.applyPlugins({
      key: 'modifyRendererPath',
      type: api.ApplyPluginsType.modify,
      initialValue: '',
    });
    api.writeTmpFile({
      path: 'App.js',
      content: Mustache.render(umiTpl, {
        // @ts-ignore
        enableTitle: api.config.title !== false,
        defaultTitle: api.config.title || '',
        rendererPath: winPath(rendererPath),
        rootElement: api.config.mountElementId,
        enableSSR: !!api.config.ssr,
        dynamicImport: !!api.config.dynamicImport,
      }),
    });
  });
}
