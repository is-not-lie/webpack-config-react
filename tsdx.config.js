module.exports = {
  rollup(config) {
    const _external = config.external;
    /** 配置需要打包的依赖 */
    config.external = id =>
      ['lodash-es'].includes(id) ? false : _external(id)
    return config;
  },
};
