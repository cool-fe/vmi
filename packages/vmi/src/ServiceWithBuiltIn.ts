import { IServiceOpts, Service as CoreService } from '@umijs/core';
import { dirname } from 'path';

class Service extends CoreService {
  constructor(opts: IServiceOpts) {
    // process.env.UMI_UI = 'none';
    process.env.IS_VMI = 'true';
    process.env.UMI_VERSION = require('../package').version;
    process.env.UMI_DIR = dirname(require.resolve('../package'));

    super({
      ...opts,
      presets: [
        require.resolve('@winfe/preset-built-in'),
        require.resolve('@winfe/preset-built-vmi'),
        ...(opts.presets || []),
      ],
      plugins: [require.resolve('./plugins/umiAlias'), ...(opts.plugins || [])],
    });
  }
}

export { Service };
