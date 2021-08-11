export { IDumiOpts } from './context';

//@ts-ignore
export default function (api) {
  const plugins = [
    require.resolve('./plugins/features/init'),

    // generate nuxt file
    require.resolve(
      './plugins/generateFiles/internals/app-enhancers/entryImportsAhead',
    ),
    require.resolve('./plugins/generateFiles/internals/layout/layout'),

    require.resolve('./plugins/features/entry'),
    require.resolve('./plugins/features/routes'),

    require.resolve('./plugins/features/webpack'),
    require.resolve('./plugins/features/outputPath'),
    require.resolve('./plugins/features/alias'),
  ];

  if (api.env === 'development') {
    plugins.push(require.resolve('./plugins/features/componentRoutes'));
  }

  return { plugins };
}
