import { IApi } from '@umijs/types';
import { resolve } from 'path';
import uploadMaterialOutput from '../uploadMaterialOutput';

const externals = {
  vue: {
    root: 'Vue',
    commonjs: 'vue',
    commonjs2: 'vue',
    amd: 'vue',
  },
  'element-ui': {
    root: 'elementUi',
    commonjs: 'element-ui',
    commonjs2: 'element-ui',
    amd: 'element-ui',
  },
  '@winfe/win-request': {
    root: 'winRequest',
    commonjs: 'win-request',
    commonjs2: 'win-request',
    amd: 'win-request',
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

  api.chainWebpack(async memo => {
    memo.entryPoints.clear();
    memo.entry('index').add(resolve(cwd, './index.js'));

    // component output need umd
    memo.output
      .publicPath('./')
      .path(resolve(cwd, `dist/${require(`${cwd}/package.json`).version}`))
      .filename('index.js')
      .chunkFilename('[id].js')
      .libraryTarget('umd');

    memo.externals(externals);

    // 添加全局scss文件
    const types = ['vue-modules', 'vue', 'normal-modules', 'normal'];

    types.forEach(type => {
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

    memo
      .plugin('extract-css')
      .tap(options =>
        options.map(option => ({ ...option, filename: 'index.css' })),
      );

    memo
      .plugin('CleanWebpackPlugin')
      .use(require('clean-webpack-plugin').CleanWebpackPlugin);

    return memo;
  });

  api.onBuildComplete(({ err }) => {
    if (!err) {
      if (api.args.upload) uploadMaterialOutput(cwd);
    }
  });
};
