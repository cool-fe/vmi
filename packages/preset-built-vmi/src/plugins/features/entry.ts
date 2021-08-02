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
    memo.entry('client').add(join(require.resolve('@vmi/client')));
    return memo;
  });
};
