import { IApi } from '@umijs/types';
import { join } from 'path';

export default (api: IApi) => {
  const { paths, pkg, cwd } = api;

  api.describe({
    key: 'entry',
    config: {
      schema(joi) {
        return joi.object();
      },
      default: {},
    },
  });

  api.chainWebpack(async (memo) => {
    memo.entryPoints.delete('umi');
    memo.entry('umi').add(require.resolve('@vmi/client/src/client'));
    return memo;
  });
};
