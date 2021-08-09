import { IApi } from '@umijs/types';
import { resolve } from 'path';

const externals = {
  vue: {
    root: 'Vue',
    commonjs: 'vue',
    commonjs2: 'vue',
    amd: 'vue',
  },
  'element-ui': {
    root: 'element-ui',
    commonjs: 'element-ui',
    commonjs2: 'element-ui',
    amd: 'element-ui',
  },
};

export default (api: IApi) => {
  const { cwd } = api;

  api.describe({
    key: 'component',
    config: {
      schema(joi) {
        return joi.object();
      },
      default: {},
    },
  });

  api.chainWebpack(async (memo) => {
    memo.entryPoints.delete('umi');
    memo.entryPoints.delete('vmi');
    memo.entry('index').add(resolve(cwd, './index.js'));

    // component output need umd
    memo.output
      .publicPath('./')
      .path(resolve(cwd, './lib/'))
      .filename('index.js')
      .chunkFilename('[id].js')
      .libraryTarget('umd');

    memo.externals(externals);

    // 添加全局scss文件
    const types = ['vue-modules', 'vue', 'normal-modules', 'normal'];

    types.forEach((type) => {
      //匹配到所有需要导入的文件
      memo.module
        .rule('sass')
        .oneOf(type)
        .use('style-resource')
        .loader('style-resources-loader')
        .options({
          patterns: [require.resolve('@winfe/theme-helper')],
        });
    });

    memo.module
      .rule('css')
      .use('extract-css-loader')
      .tap((options) => {
        // 修改它的选项...
        options.filename = 'index.css';
        return options;
      });

    memo.plugin('CleanWebpackPlugin').use(require('clean-webpack-plugin').CleanWebpackPlugin);

    return memo;
  });
};
