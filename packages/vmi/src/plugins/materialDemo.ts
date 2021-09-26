import { IApi } from '@umijs/types';

export default (api: IApi) => {
  const { cwd } = api;

  api.describe({
    key: 'materialDemo',
    config: {
      schema(joi) {
        return joi.object();
      },
      default: {},
    },
  });

  api.modifyConfig((initialValue) => {
    const { name, title, category, domain } = api.pkg.componentConfig;
    if (!name || !title || !category || !domain || !name.split('/').length) {
      throw new Error('物料的config不全，请检查');
    }
    initialValue.publicPath = `/material-demos/${category}/${
      name.split('/')[1]
    }/`;
    initialValue.base = `/material-demos/${category}/${name.split('/')[1]}/`;
    return initialValue;
  });
};
