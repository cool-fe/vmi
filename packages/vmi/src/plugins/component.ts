import { IApi } from '@umijs/types';
import { lodash } from '@umijs/utils';
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
  'his-request': {
    root: 'HISREUEST',
    commonjs: 'his-request',
    commonjs2: 'his-request',
    amd: 'his-request',
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

  api.modifyConfig((initialValue) => {
    initialValue.outputPath = 'lib';
    return initialValue;
  });

  api.chainWebpack(async (memo) => {
    memo.entryPoints.clear();
    memo.entry('index').add(resolve(cwd, './index.js'));

    const packageNameSplit = api.pkg.name?.split('/') || [];
    const packageName = lodash.camelCase(
      packageNameSplit[1] || packageNameSplit[0],
    );
    if (!packageName) {
      throw new Error('物料的name不能为空，请检查根目录package.json的name属性');
    }
    // component output need umd
    memo.output
      .libraryTarget('umd')
      .libraryExport('default')
      .library(packageName);

    memo.externals(externals);

    // todo 暂时只对component打包生效，后续project的时候需要移到公共逻辑
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
