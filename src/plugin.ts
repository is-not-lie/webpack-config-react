import webpack from 'webpack';
import fs from 'fs';
import path from 'path';
import { pick } from 'lodash';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import type { Compiler } from 'webpack'
import type { Options as HtmlWebpackPluginOptions } from 'html-webpack-plugin'

class EntryAssetsWebpackPlugin extends HtmlWebpackPlugin {
  $options: Options
  name = 'EntryAssetsWebpackPlugin'
  filename: string
  outputName!: string
  publicPath!: string
  data: { js: string[], css: string[] } = {
    js: [],
    css: []
  }
  constructor(options: Options = {}) {
    super(options);
    this.$options = options;
    this.filename = options.filename || 'entryAssets.json';
  }

  apply(compiler: Compiler) {
    super.apply(compiler);

    compiler.hooks.initialize.tap(this.name, () => {
      const { filename } = this
      if (!(/\.json$/.test(filename)))
        throw new Error(`【${this.name}】配置项 options.file 需为json格式`);
    });

    compiler.hooks.compilation.tap(this.name, compilation => {
      const hooks = HtmlWebpackPlugin.getHooks(compilation)

      hooks.beforeAssetTagGeneration.tapAsync(this.name, (data, cb) => {
        Object.assign(this.data, pick(data.assets, ['js', 'css']))
        cb(null, data)
      })

      hooks.alterAssetTags.tapAsync(this.name, (data, cb) => {
        const { publicPath } = data
        const { js, css } = this.data
        this.publicPath = publicPath
        Object.assign(this.data, {
          js: js.map(x => x.slice(publicPath.length)),
          css: css.map(x => x.slice(publicPath.length)),
        })
        cb(null, data)
      })

      hooks.afterEmit.tapAsync(this.name, (data, cb) => {
        this.outputName = data.outputName
        cb(null, data)
      })

      compiler.hooks.emit.tapAsync(this.name, (compilation, callback) => {
        try {
          const data = JSON.stringify(this.data);
          compilation.deleteAsset(this.outputName);
          compilation.emitAsset(this.filename, new webpack.sources.RawSource(data));
          callback();
        } catch (error) {
          console.error(error);
        }
      });

      compiler.hooks.afterEmit.tap(this.name, () => {
        const { writeToFileEmit = true } = this.$options
        if (writeToFileEmit) {
          const parentDir = compiler.options.output.path;
          const data = JSON.stringify(this.data, null, 2)

          if (parentDir && !fs.existsSync(parentDir))
            fs.mkdirSync(parentDir, { recursive: true })
          if (parentDir)
            fs.writeFile(path.resolve(parentDir, this.filename), data, () => {})
        }
      });
    });
  }
}

export default EntryAssetsWebpackPlugin;

interface Options extends HtmlWebpackPluginOptions {
  filename?: string
  writeToFileEmit?: boolean
}
