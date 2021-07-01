import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { IApi } from '@umijs/types';

export default function (api: IApi) {
  const {
    utils: { Mustache },
  } = api;

  api.onGenerateFiles(async (args) => {
    const umiTpl = readFileSync(join(__dirname, 'client.tpl'), 'utf-8');
    const rendererPath = await api.applyPlugins({
      key: 'modifyRendererPath',
      type: api.ApplyPluginsType.modify,
      initialValue: '',
    });
    api.writeTmpFile({
      path: 'client.js',
      content: Mustache.render(umiTpl, {
        // @ts-ignore
        enableTitle: api.config.title !== false,
        defaultTitle: api.config.title || '',
      }),
    });
  });
}
