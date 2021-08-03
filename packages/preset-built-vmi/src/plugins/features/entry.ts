import { IApi } from '@umijs/types';

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
    memo.entry('vmi').add(require.resolve('@vmi/client/src/client'));
    return memo;
  });
};
