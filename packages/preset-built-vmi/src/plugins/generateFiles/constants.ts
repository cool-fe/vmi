import { winPath } from '@umijs/utils';
import { dirname } from 'path';

export const runtimePath = winPath(
  dirname(require.resolve('@vmi/runtime/package.json')),
);
export const renderReactPath = winPath('');
