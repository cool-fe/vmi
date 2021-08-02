import fs from 'fs';
//@ts-ignore
import Glob from 'glob';
//@ts-ignore
import pify from 'pify';
//@ts-ignore
import { createRoutes } from '@nuxt/utils';
import type { IRoute } from '@umijs/types';
import type { IDumiOpts } from '../index';
import ctx from '../context';

const supportedExtensions = ['vue', 'js', 'jsx'];

const glob = pify(Glob);

function globPathWithExtensions(path: string) {
  return `${path}/**/*.{${supportedExtensions.join(',')}}`;
}

async function resolveFiles(
  dir: string,
  cwd: string = ctx.umi?.paths?.cwd as string,
) {
  return await glob(globPathWithExtensions(dir), {
    cwd,
  });
}

async function resolveRoutes(
  absPath: string,
  opts: IDumiOpts,
  parentRoutePath: string = '/',
  routeNameSplitter: string = '-',
  trailingSlash: boolean | undefined = undefined,
) {
  // Use nuxt createRoutes bases on pages/
  const files = {};
  let routes: IRoute[] = [];
  const ext = new RegExp(`\\.(${supportedExtensions.join('|')})$`);
  for (const page of await resolveFiles(absPath)) {
    const key = page.replace(ext, '');
    // .vue file takes precedence over other extensions
    if (/\.vue$/.test(page) || !files[key]) {
      files[key] = page.replace(/(['"])/g, '\\$1');
    }
  }
  routes = createRoutes({
    files: Object.values(files),
    srcDir: ctx.umi?.paths.absSrcPath,
    pagesDir: ctx.umi?.paths.absPagesPath,
    routeNameSplitter,
    supportedExtensions: supportedExtensions,
    trailingSlash,
  });

  return routes;
}

export default async (absPath: string, opts: IDumiOpts): Promise<IRoute[]> => {
  const routes = [];
  if (fs.existsSync(absPath)) {
    routes.push(...(await resolveRoutes(absPath, opts)));
  }

  return routes;
};
