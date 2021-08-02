export { IDumiOpts } from './context';

export default function () {
  return {
    plugins: [
      // register methods
      // require.resolve('./plugins/registerMethods'),

      require.resolve('./plugins/features/init'),

      // misc
      require.resolve('./plugins/routes'),

      // generate nuxt file
      require.resolve(
        './plugins/generateFiles/internals/app-enhancers/entryImportsAhead',
      ),
      require.resolve('./plugins/generateFiles/internals/layout/layout'),

      // require.resolve('./plugins/generateFiles/routes'),
      // require.resolve('./plugins/generateFiles/store'),

      require.resolve('./plugins/features/entry'),
      require.resolve('./plugins/features/routes'),
      require.resolve('./plugins/features/webpack'),
      require.resolve('./plugins/features/outputPath'),
      require.resolve('./plugins/features/alias'),

      // require.resolve('./plugins/commands/dev/dev'),
    ],
  };
}
