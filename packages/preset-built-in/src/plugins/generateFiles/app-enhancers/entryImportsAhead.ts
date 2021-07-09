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
      join(__dirname, 'entryImportsAhead.tpl'),
      'utf-8',
    );

    api.writeTmpFile({
      path: 'app-enhancers/addEntryCode.ts',
      content: Mustache.render(entryImportsAheadTpl, {
        entryCode: (
          await api.applyPlugins({
            key: 'addEntryCode',
            type: api.ApplyPluginsType.add,
            initialValue: [],
          })
        ).join('\r\n'),
      }),
    });
    api.writeTmpFile({
      path: 'app-enhancers/addEntryCodeAhead.ts',
      content: Mustache.render(entryImportsAheadTpl, {
        entryCodeAhead: (
          await api.applyPlugins({
            key: 'addEntryCodeAhead',
            type: api.ApplyPluginsType.add,
            initialValue: [],
          })
        ).join('\r\n'),
        
      }),
    });
    api.writeTmpFile({
      path: 'app-enhancers/addPolyfillImports.ts',
      content: Mustache.render(entryImportsAheadTpl, {
        polyfillImports: importsToStr(
          await api.applyPlugins({
            key: 'addPolyfillImports',
            type: api.ApplyPluginsType.add,
            initialValue: [],
          }),
        ).join('\r\n'),
      }),
    });
    api.writeTmpFile({
      path: 'app-enhancers/addEntryImportsAhead.ts',
      content: Mustache.render(entryImportsAheadTpl, {
        importsAhead: importsToStr(
          await api.applyPlugins({
            key: 'addEntryImportsAhead',
            type: api.ApplyPluginsType.add,
            initialValue: [],
          }),
        ).join('\r\n'),
      }),
    });
    api.writeTmpFile({
      path: 'app-enhancers/addEntryImports.ts',
      content: Mustache.render(entryImportsAheadTpl, {
        imports: importsToStr(
          await api.applyPlugins({
            key: 'addEntryImports',
            type: api.ApplyPluginsType.add,
            initialValue: [],
          }),
        ).join('\r\n'),
      }),
    });
  });
}
