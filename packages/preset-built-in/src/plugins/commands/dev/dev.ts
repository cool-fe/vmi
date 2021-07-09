import { IServerOpts, Server } from '@vmi/server';
import { BundlerConfigType, IApi } from '@vmi/types';
import { delay } from '@vmi/utils';
import assert from 'assert';
import { cleanTmpPathExceptCache, getBundleAndConfigs } from '../buildDevUtils';
import generateFiles from '../generateFiles';
import createRouteMiddleware from './createRouteMiddleware';
import { watchPkg } from './watchPkg';


export default (api: IApi) => {
  const {
    env,
    paths,
    utils: { chalk, portfinder },
  } = api;

  let port: number;
  let hostname: string;
  let server: Server;
  const unwatchs: Function[] = [];

  function destroy() {
    for (const unwatch of unwatchs) {
      unwatch();
    }
    server?.listeningApp?.close();
  }

  /**   test */

  api.addEntryCode(
    () =>
    `
    // addEntryCode
    export const bootstrap = qiankun_genBootstrap(clientRender);
    export const mount = qiankun_genMount('${api.config.mountElementId}');
    export const unmount = qiankun_genUnmount('${api.config.mountElementId}');
    export const update = qiankun_genUpdate();

    if (!window.__POWERED_BY_QIANKUN__) {
      bootstrap().then(mount);
    }
    `,
  );

  api.addEntryCodeAhead(() =>
    `//addEntryCodeAhead\n import { _onCreate } from './plugin-locale/locale';\n_onCreate();`.trim(),
  );

  // @ts-ignore
  api.addEntryImports(() => {
    return {
      source: '@@/plugin-qiankun/lifecycles',
      specifier:
        '{ genMount as qiankun_genMount, genBootstrap as qiankun_genBootstrap, genUnmount as qiankun_genUnmount, genUpdate as qiankun_genUpdate }',
    };
  });

  api.addEntryImportsAhead(() => ({
    source: `${require.resolve('webpack')}' //addEntryImportsAhead`,
  }));

  api.addPolyfillImports(() => {
    return true
      ? [
          {
            source: `${require.resolve('lodash')}' //addPolyfillImports`,
          },
        ]
      : [];
  });

  /**test end */

  const sharedMap = new Map();
  api.onDevCompileDone(({ stats, type }) => {
    // don't need ssr bundler chunks
    if (type === BundlerConfigType.ssr) {
      return;
    }
    // store client build chunks
    sharedMap.set('chunks', stats.compilation.chunks);
  });

  api.registerCommand({
    name: 'dev',
    description: 'start a dev server for development',
    fn: async function ({ args }) {
      const defaultPort =
        process.env.PORT || args?.port || api.config.devServer?.port;
      port = await portfinder.getPortPromise({
        port: defaultPort ? parseInt(String(defaultPort), 10) : 8000,
      });
      hostname = process.env.HOST || api.config.devServer?.host || '0.0.0.0';
      console.log(chalk.cyan('Starting the development server...'));
      process.send?.({ type: 'UPDATE_PORT', port });

      // enable https, HTTP/2 by default when using --https
      const isHTTPS = process.env.HTTPS || args?.https;

      cleanTmpPathExceptCache({
        absTmpPath: paths.absTmpPath!,
      });
      const watch = process.env.WATCH !== 'none';

      // // generate files
      const unwatchGenerateFiles = await generateFiles({ api, watch });
      if (unwatchGenerateFiles) unwatchs.push(unwatchGenerateFiles);

      if (watch) {
        // watch pkg changes
        const unwatchPkg = watchPkg({
          cwd: api.cwd,
          onChange() {
            api.logger.info(`Plugins in package.json changed.`);
            api.restartServer();
          },
        });
        unwatchs.push(unwatchPkg);

        // watch config change
        const unwatchConfig = api.service.configInstance.watch({
          userConfig: api.service.userConfig,
          onChange: async ({ pluginChanged, userConfig, valueChanged }) => {
            if (pluginChanged.length) {
              console.log();
              api.logger.info(
                `Plugins of ${pluginChanged
                  .map((p) => p.key)
                  .join(', ')} changed.`,
              );
              api.restartServer();
            }
            if (valueChanged.length) {
              let reload = false;
              let regenerateTmpFiles = false;
              const fns: Function[] = [];
              const reloadConfigs: string[] = [];
              valueChanged.forEach(({ key, pluginId }) => {
                const { onChange } = api.service.plugins[pluginId].config || {};
                if (onChange === api.ConfigChangeType.regenerateTmpFiles) {
                  regenerateTmpFiles = true;
                }
                if (!onChange || onChange === api.ConfigChangeType.reload) {
                  reload = true;
                  reloadConfigs.push(key);
                }
                if (typeof onChange === 'function') {
                  fns.push(onChange);
                }
              });

              if (reload) {
                console.log();
                api.logger.info(`Config ${reloadConfigs.join(', ')} changed.`);
                api.restartServer();
              } else {
                api.service.userConfig =
                  api.service.configInstance.getUserConfig();

                //           // TODO: simplify, 和 Service 里的逻辑重复了
                //           // 需要 Service 露出方法
                const defaultConfig = await api.applyPlugins({
                  key: 'modifyDefaultConfig',
                  type: api.ApplyPluginsType.modify,
                  initialValue:
                    await api.service.configInstance.getDefaultConfig(),
                });
                api.service.config = await api.applyPlugins({
                  key: 'modifyConfig',
                  type: api.ApplyPluginsType.modify,
                  initialValue: api.service.configInstance.getConfig({
                    defaultConfig,
                  }) as any,
                });

                if (regenerateTmpFiles) {
                  await generateFiles({ api });
                } else {
                  fns.forEach((fn) => fn());
                }
              }
            }
          },
        });
        unwatchs.push(unwatchConfig);
      }

      // delay dev server 启动，避免重复 compile
      // https://github.com/webpack/watchpack/issues/25
      // https://github.com/yessky/webpack-mild-compile
      await delay(500);

      // dev
      const { bundler, bundleConfigs, bundleImplementor } =
        await getBundleAndConfigs({ api, port });

      const opts: IServerOpts = bundler.setupDevServerOpts({
        bundleConfigs: bundleConfigs,
        bundleImplementor,
      });

      const beforeMiddlewares = await api.applyPlugins({
        key: 'addBeforeMiddewares',
        type: api.ApplyPluginsType.add,
        initialValue: [],
        args: {},
      });
      const middlewares = await api.applyPlugins({
        key: 'addMiddewares',
        type: api.ApplyPluginsType.add,
        initialValue: [],
        args: {},
      });
      ('');

      server = new Server({
        ...opts,
        compress: true,
        https: !!isHTTPS,
        headers: {
          'access-control-allow-origin': '*',
        },
        proxy: api.config.proxy,
        beforeMiddlewares,
        afterMiddlewares: [
          ...middlewares,
          createRouteMiddleware({ api, sharedMap }),
        ],
        ...(api.config.devServer || {}),
      });
      const listenRet = await server.listen({
        port,
        hostname,
      });
      return {
        ...listenRet,
        destroy,
      };
    },
  });

  api.registerMethod({
    name: 'getPort',
    fn() {
      assert(
        env === 'development',
        `api.getPort() is only valid in development.`,
      );
      return port;
    },
  });

  api.registerMethod({
    name: 'getHostname',
    fn() {
      assert(
        env === 'development',
        `api.getHostname() is only valid in development.`,
      );
      return hostname;
    },
  });

  api.registerMethod({
    name: 'getServer',
    fn() {
      assert(
        env === 'development',
        `api.getServer() is only valid in development.`,
      );
      return server;
    },
  });

  api.registerMethod({
    name: 'restartServer',
    fn() {
      console.log(chalk.gray(`Try to restart dev server...`));
      destroy();
      process.send?.({ type: 'RESTART' });
    },
  });
};
