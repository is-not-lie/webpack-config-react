import { ProgressPlugin, HotModuleReplacementPlugin } from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import ReactRefreshPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { getEnv, resolve, useStyleLoaders } from './tool'
import EntryAssetsWebpackPlugin from './plugin'
import fs from 'fs'

import type { Entry, Configuration, ResolveOptions, WebpackPluginInstance } from 'webpack'
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server'

export * from './middleware'

const assetsFileName = 'entryAssets.json'

export default (config: WebpackConfig, cb?: (config: Configuration) => Configuration): Configuration => {
  const { entry, output, typescript, alias, devServer } = config
  const { __DEV__, __PROD__ } = getEnv()
  const outputPath = output?.path || resolve('dist')
  const extensions: string[] = ['.js', '.jsx', '.json']

  const plugins: WebpackPluginInstance[] = [
    new ProgressPlugin(),
    new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: [outputPath] }),
    new EntryAssetsWebpackPlugin({
      filename: assetsFileName,
      outPath: __dirname
    })
  ]

  const baseRule = {
    test: /\.(j|t)sx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        [
          '@babel/preset-env',
          {
            useBuiltIns: 'usage',
            corejs: 3
          }
        ],
        '@babel/preset-react'
      ],
      plugins: [] as string[]
    }
  }

  if (typescript) {
    extensions.push(...['.ts', '.tsx'])
    baseRule.options.presets.push('@babel/preset-typescript')
  }

  if (__DEV__) {
    baseRule.options.plugins.push('react-refresh/babel')
    plugins.push(...[new ReactRefreshPlugin({ overlay: { sockIntegration: 'whm' } }), new HotModuleReplacementPlugin()])
  }

  if (__PROD__) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash:10].css',
        chunkFilename: '[name].[contenthash:10].chunk.css'
      })
    )
  }

  const webpackConfig: Configuration = {
    mode: __PROD__ ? 'production' : 'development',
    devtool: __PROD__ ? 'hidden-source-map' : 'cheap-module-source-map',
    entry,
    output: {
      path: outputPath,
      publicPath: __PROD__ ? '/' : './',
      filename: __PROD__ ? '[name].[contenthash:10].js' : '[name].js',
      chunkFilename: __PROD__ ? '[name].[contenthash:10].chunk.js' : '[name].chunk.js',
      ...output
    },
    module: {
      rules: [
        {
          oneOf: [
            baseRule,
            {
              test: /\.css$/,
              use: useStyleLoaders({
                importLoaders: 1,
                modules: {
                  mode: 'icss'
                }
              })
            },
            {
              test: /\.module\.css$/,
              use: useStyleLoaders({
                importLoaders: 1,
                modules: {
                  mode: 'local'
                }
              })
            },
            {
              test: /\.less$/,
              use: useStyleLoaders(
                {
                  importLoaders: 2,
                  modules: {
                    mode: 'icss'
                  }
                },
                'less-loader',
                {
                  lessOptions: { javaScriptEnabled: true }
                }
              )
            },
            {
              test: /\.module\.less$/,
              use: useStyleLoaders(
                {
                  importLoaders: 2,
                  modules: {
                    mode: 'local'
                  }
                },
                'less-loader',
                {
                  lessOptions: { javaScriptEnabled: true }
                }
              )
            },
            {
              test: /\.s(a|c)ss$/,
              use: useStyleLoaders(
                {
                  importLoaders: 2,
                  modules: {
                    mode: 'icss'
                  }
                },
                'sass-loader',
                {
                  sassOptions: { javaScriptEnabled: true }
                }
              )
            },
            {
              test: /\.module\.s(a|c)ss$/,
              use: useStyleLoaders(
                {
                  importLoaders: 2,
                  modules: {
                    mode: 'local'
                  }
                },
                'sass-loader',
                {
                  sassOptions: { javaScriptEnabled: true }
                }
              )
            },
            {
              test: /\.html$/,
              loader: 'html-loader'
            },
            {
              test: /\.(jpe?g|png|gif|svg)$/,
              type: 'asset',
              generator: {
                filename: 'images/[name].[hash:8][ext]'
              },
              parser: {
                dataUrlCondition: {
                  maxSize: 8 * 1024
                }
              }
            },
            {
              test: /\.(woff|woff2|eot|ttf)$/,
              type: 'asset/resource',
              generator: {
                filename: 'fonts/[name].[hash:8][ext]'
              }
            }
          ]
        }
      ]
    },
    plugins,
    resolve: {
      extensions,
      alias,
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        url: require.resolve('url'),
        buffer: require.resolve('buffer'),
        stream: require.resolve('stream-browserify'),
        fs: false,
        path: require.resolve('path-browserify')
      }
    },
    optimization: {
      minimize: __PROD__,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          extractComments: false,
          terserOptions: {
            compress: {
              drop_console: true,
              ecma: 5
            }
          }
        })
      ],
      splitChunks: {
        chunks: 'all',
        maxSize: 1000000,
        minSize: 500000
      }
    },
    ...(devServer && { devServer })
  }

  return typeof cb === 'function' ? cb(webpackConfig) : webpackConfig
}

export const getAssetsFile = () => {
  try {
    if (fs.existsSync(__dirname + assetsFileName)) return require(__dirname + assetsFileName)
  } catch (error) {
    console.log(`🙅 读取文件 ${__dirname + assetsFileName} 失败, 错误信息: ${error}`)
    return {}
  }
  return {}
}

export interface WebpackConfig {
  entry: Entry
  typescript?: boolean
  output?: {
    path?: string
    publicPath?: string
    filename?: string
    chunkFilename?: string
    [key: string]: any
  }
  alias?: ResolveOptions['alias']
  devServer?: DevServerConfiguration
}
