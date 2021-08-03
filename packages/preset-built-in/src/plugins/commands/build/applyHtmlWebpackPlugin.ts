import { BundlerConfigType, IApi, webpack } from '@umijs/types';
import { platform } from 'os';
import { getHtmlGenerator } from '../htmlUtils';

export function fixRoutePathInWindows(path?: string) {
  // window 下 : 不是一个合法路径，所以需要处理一下
  // 不直接删除是为了保证 render 可以生效
  if (!path || !path?.includes(':') || platform() !== 'win32') {
    return path;
  }
  return path.replace(/:/g, '.');
}

export default function (api: IApi) {
  class HtmlWebpackPlugin {
    apply(compiler: webpack.Compiler) {
      compiler.hooks.emit.tapPromise(
        'UmiHtmlGeneration',
        async (compilation: any) => {
          const html = getHtmlGenerator({ api });
          const routeMap = await api.applyPlugins({
            key: 'modifyExportRouteMap',
            type: api.ApplyPluginsType.modify,
            initialValue: [{ route: { path: '/' }, file: 'index.html' }],
            args: {
              html,
            },
          });
          for (const { route, file } of routeMap) {
            const defaultContent = await html.getContent({
              route,
              assets: compilation.assets,
              chunks: compilation.chunks,
            });
            const content = await api.applyPlugins({
              key: 'modifyProdHTMLContent',
              type: api.ApplyPluginsType.modify,
              initialValue: defaultContent,
              args: {
                route,
                file,
              },
            });

            compilation.assets[fixRoutePathInWindows(file)!] = {
              source: () => content,
              size: () => content.length,
            };
          }
          return true;
        },
      );
    }
  }

  api.modifyBundleConfig(
    (bundleConfig, { env, mfsu, type, bundler: { id } }) => {
      const enableWriteToDisk =
        api.config.devServer && api.config.devServer.writeToDisk;
      if (
        !mfsu &&
        (env === 'production' || enableWriteToDisk) &&
        id === 'webpack' &&
        process.env.HTML !== 'none' &&
        // avoid ssr bundler build override index.html
        type === BundlerConfigType.csr
      ) {
        bundleConfig.plugins?.unshift(new HtmlWebpackPlugin());
      }
      return bundleConfig;
    },
  );
}
