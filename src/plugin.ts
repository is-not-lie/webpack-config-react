import webpack from 'webpack'
import fs from 'fs'
import path from 'path'
import { pick } from 'lodash'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import type { Compiler } from 'webpack'

class EntryAssetsWebpackPlugin {
  name = 'EntryAssetsWebpackPlugin'
  outputName!: string
  data: { js: string[]; css: string[] } = {
    js: [],
    css: []
  }

  constructor(private options: Options) {}

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation) => {
      const hooks = HtmlWebpackPlugin.getHooks(compilation)

      hooks.beforeAssetTagGeneration.tapAsync(this.name, (data, cb) => {
        Object.assign(this.data, pick(data.assets, ['js', 'css']))
        cb(null, data)
      })

      hooks.alterAssetTags.tapAsync(this.name, (data, cb) => {
        const { publicPath } = data
        const { js, css } = this.data
        Object.assign(this.data, {
          js: js.map((x) => x.slice(publicPath.length)),
          css: css.map((x) => x.slice(publicPath.length))
        })
        cb(null, data)
      })

      hooks.afterEmit.tapAsync(this.name, (data, cb) => {
        this.outputName = data.outputName
        cb(null, data)
      })

      compiler.hooks.emit.tapAsync(this.name, (compilation, callback) => {
        try {
          const data = JSON.stringify(this.data)
          compilation.deleteAsset(this.outputName)
          compilation.emitAsset(this.options.filename, new webpack.sources.RawSource(data))
          callback()
        } catch (error) {
          console.error(error)
        }
      })

      compiler.hooks.afterEmit.tap(this.name, () => {
        const parentDir = compiler.options.output.path
        const data = JSON.stringify(this.data, null, 2)

        if (parentDir && !fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true })
        if (parentDir) fs.writeFile(path.resolve(parentDir, this.options.filename), data, () => {})
      })
    })
  }
}

export default EntryAssetsWebpackPlugin

interface Options {
  filename: string
  outPath: string
}
