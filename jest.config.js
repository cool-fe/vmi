const {
  files,
  getFileName,
} = require('@umijs/bundler-webpack/lib/requireHook');

const webpackModuleNameMapper = files.reduce((memo, file) => {
  const fileName = getFileName(file);
  memo[`^${file}$`] = `@umijs/deps/compiled/webpack/${fileName}`;
  return memo;
}, {});

module.exports = {
  // disable css files mock for bundler-webpack's css import tests
  moduleNameMapper: {
    // terser-webpack-plugin
    '^webpack$': '@umijs/deps/compiled/webpack',
    ...webpackModuleNameMapper,
  },
  transformIgnorePatterns: ['/node_modules/(?!.*@babel)[^/]+?/'],
  collectCoverageFrom(memo) {
    return memo.concat([
      // preset-built-in
      '!packages/preset-built-in/src/plugins/commands/config/*',
      '!packages/preset-built-in/src/plugins/commands/help/*',
      '!packages/preset-built-in/src/plugins/commands/plugin/*',

      // cli 入口不测
      '!packages/vmi/src/cli.ts',
      '!packages/vmi/src/forkedDev.ts',
      '!packages/vmi/src/ServiceWithBuiltIn.ts',
      '!packages/create-umi-app/src/cli.ts',

      // dev 在 fork 出来的子进程下，测不了
      '!packages/preset-built-in/src/plugins/commands/dev/**/*',
    ]);
  },
};
