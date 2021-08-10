export { IDumiOpts } from './context';

export default function() {
  return {
    plugins: [
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
    ],
  };
}
