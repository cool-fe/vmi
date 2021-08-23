import { IApi } from '@umijs/types';
import { dirname } from 'path';

export default (api: IApi) => {
  const { cwd } = api;

  api.describe({
    key: 'webpack',
    config: {
      schema(joi) {
        return joi.object();
      },
      default: {},
    },
  });

  api.chainWebpack(async (memo) => {
    memo.resolve.extensions
      .merge(['.vue'])
      .end()
      .modules.merge([cwd + '/node_modules']);

    // vue-loader
    memo.module
      .rule('vue')
      .test(/\.vue$/i)
      .include.add([
        cwd,
        // client none compile, need add include
        dirname(require.resolve('@winfe/client/package.json')),
        // import module out of cwd using APP_ROOT
        // issue: https://github.com/umijs/umi/issues/5594
        ...(process.env.APP_ROOT ? [process.cwd()] : []),
      ])
      .end()
      .use('vue-loader')
      .loader(require.resolve('vue-loader'))
      .options({
        transformAssetUrls: {
          video: 'src',
          source: 'src',
          object: 'src',
          embed: 'src',
        },
      });

    memo.plugin('VueLoaderPlugin').use(require('vue-loader').VueLoaderPlugin);

    return memo;
  });
};
