//@ts-ignore
import { createRoutes } from '@nuxt/utils';
import type { IRoute } from '@umijs/types';
//@ts-ignore
import Glob from 'glob';
//@ts-ignore
import pify from 'pify';
import ctx from '../context';
import type { IDumiOpts } from '../index';

const supportedExtensions = ['vue', 'js', 'jsx'];

const glob = pify(Glob);

function globPathWithExtensions(path: string) {
  return `${path}/**/*.{${supportedExtensions.join(',')}}`;
}

async function resolveFiles(
  dir: string,
  cwd: string = ctx.umi?.paths?.absSrcPath as string,
) {
  return await glob(globPathWithExtensions(dir), {
    cwd,
  });
}

async function resolveRoutes(
  pagesPath: string,
  opts: IDumiOpts,
  parentRoutePath: string = '/',
  routeNameSplitter: string = '-',
  trailingSlash: boolean | undefined = undefined,
) {
  // Use nuxt createRoutes bases on pages/
  const files = {};
  let routes: IRoute[] = [];
  const ext = new RegExp(`\\.(${supportedExtensions.join('|')})$`);
  const pages = await resolveFiles(pagesPath);
  for (const page of pages) {
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

export default async (
  absPagesPath: string,
  opts: IDumiOpts,
): Promise<IRoute[]> => {
  const routes = [...(await resolveRoutes(absPagesPath, opts))];
  return routes;
};
