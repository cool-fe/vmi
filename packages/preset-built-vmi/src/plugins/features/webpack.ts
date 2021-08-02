import { IApi } from '@umijs/types';
import { resolve, winPath } from '@umijs/utils';
import { dirname, resolve as $resolve, join } from 'path';

export default (api: IApi) => {
  const { paths, pkg, cwd } = api;

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
    memo.module
      .rule('vue')
      .test(/\.vue$/i)
      .include.add([
        cwd,
        // import module out of cwd using APP_ROOT
        // issue: https://github.com/umijs/umi/issues/5594
        ...(process.env.APP_ROOT ? [process.cwd()] : []),
      ])
      .end()
      .exclude.add(/node_modules/)
      // don't compile mfsu temp files
      // TODO: do not hard code
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
