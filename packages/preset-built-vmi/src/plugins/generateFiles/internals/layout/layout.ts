import { IApi } from '@umijs/types';
import { winPath } from '@umijs/utils';
import { readFileSync } from 'fs';
import { join } from 'path';

export function importsToStr(
  imports: { source: string; specifier?: string }[],
) {
  return imports.map((imp) => {
    const { source, specifier } = imp;
    if (specifier) {
      return `import ${specifier} from '${winPath(source)}';`;
    } else {
      return `import '${winPath(source)}';`;
    }
  });
}

export default async function (api: IApi) {
  const {
    utils: { Mustache },
  } = api;

  api.onGenerateFiles(async (args) => {
    const entryImportsAheadTpl = readFileSync(
      join(__dirname, 'layoutComponents.tpl'),
      'utf-8',
    );

    api.writeTmpFile({
      path: 'internal/layoutComponents.ts',
      content: Mustache.render(entryImportsAheadTpl, {
        layouts: `export default ${JSON.stringify({
          default: 'dsx',
        })}`,
      }),
    });
  });
}
