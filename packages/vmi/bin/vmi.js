#!/usr/bin/env node

require('../lib/cli');


// 额外的 umi 插件集
process.env.UMI_PRESETS = require.resolve('@umijs/preset-largefish');

// 执行 umi 命令
const child = fork(require.resolve('umi/bin/umi'), process.argv.slice(2), {
  stdio: 'inherit',
});