import { winPath } from '@umijs/utils';
import { dirname } from 'path';

export const runtimePath = winPath(
  dirname(require.resolve('@winfe/runtime/package.json')),
);
