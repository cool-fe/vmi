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

    // set svg linmit:10000
    memo.module
      .rule('svg')
      .use('file-loader')
      .tap((options) => ({ ...options, limit: 10000 }));

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
        compilerOptions: {
          preserveWhitespace: false,
        },
        cssModules: {
          localIdentName: '[path][name]---[local]---[hash:base64:5]',
          camelCase: true,
        },
      });

    memo.plugin('VueLoaderPlugin').use(require('vue-loader').VueLoaderPlugin);

    const oneOfsMap = memo.module.rule('sass').oneOfs.values();

    oneOfsMap.forEach((item) => {
      item
        .use('style-resources-loader')
        .loader(require.resolve('style-resources-loader'))
        .options({
          patterns: require.resolve('@winfe/theme-helper'),
        })
        .end();
    });

    return memo;
  });

  api.modifyBabelPresetOpts(function (opts, argvs) {
    return {
      ...opts,
      react: undefined,
      reactRequire: undefined,
      reactRemovePropTypes: undefined,
    };
  });

  api.modifyBabelOpts(function (opts) {
    opts.presets.push([
      require.resolve('@vue/babel-preset-jsx'),
      {
        // compositionAPI: true,
      },
    ]);
    return opts;
  });
};
