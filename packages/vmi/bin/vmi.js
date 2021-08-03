#!/usr/bin/env node

require('v8-compile-cache');

const resolveCwd = require('@umijs/deps/compiled/resolve-cwd');

const { name, bin } = require('../package.json');
const localCLI = resolveCwd.silent(`${name}/${bin['vmi']}`);
if (!process.env.USE_GLOBAL_UMI && localCLI && localCLI !== __filename) {
  const debug = require('@umijs/utils').createDebug('vmi:cli');
  debug('Using local install of vmi');
  require(localCLI);
} else {
  require('../lib/cli');
}
