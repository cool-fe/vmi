export default function () {
  return {
    plugins: [
      // register methods
      require.resolve('./plugins/registerMethods'),

      // misc
      require.resolve('./plugins/routes'),

      // generate nuxt file
      require.resolve('./plugins/generateFiles/router'),
      require.resolve('./plugins/generateFiles/App'),
      require.resolve('./plugins/generateFiles/client'),
      require.resolve('./plugins/generateFiles/middleware'),
      require.resolve('./plugins/generateFiles/index'),
      require.resolve('./plugins/generateFiles/router.scrollBehavior'),
      require.resolve('./plugins/generateFiles/store'),
      require.resolve('./plugins/generateFiles/utils'),

      require.resolve('./plugins/features/outputPath'),

      require.resolve('./plugins/commands/dev/dev'),
    ],
  };
}
