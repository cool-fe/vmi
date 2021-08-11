import { IApi, utils } from '@winfe/vmi';

export default (api: IApi) => {
  api.describe({
    key: 'sass',
    config: {
      schema(Joi) {
        return Joi.object({
          implementation: Joi.any(),
          sassOptions: Joi.object(),
          prependData: Joi.alternatives(Joi.string(), Joi.func()),
          sourceMap: Joi.boolean(),
          webpackImporter: Joi.boolean(),
        });
      },
    },
  });

  api.chainWebpack((memo, { createCSSRule }) => {
    createCSSRule({
      type: 'csr',
      lang: 'sass',
      test: /\.(sass|scss)(\?.*)?$/,
      loader: require.resolve('sass-loader'),
      options: utils.deepmerge(
        {
          implementation: require('sass'),
        },
        api.config.sass || {},
      ),
    });
    return memo;
  });
};
