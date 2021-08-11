import { IApi } from '@umijs/types';
export default (api: IApi) => {
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
    memo.entryPoints.clear();
    memo.entry('vmi').add(require.resolve('@winfe/client/src/client'));
    return memo;
  });
};
