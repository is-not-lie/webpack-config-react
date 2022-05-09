import path from 'path'
import fs from 'fs'
import { loader as styleMinifyLoader } from 'mini-css-extract-plugin'

import type { RuleSetUseItem } from 'webpack'

const appPath = fs.realpathSync(process.cwd())

export const resolve = (relativePath: string) => path.resolve(appPath, relativePath)

export const getEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development'
  return {
    __PROD__: nodeEnv === 'production',
    __DEV__: nodeEnv === 'development'
  }
}

export const useStyleLoaders = (
  cssOptions: Record<string, any>,
  loader?: string,
  lodaerOptions?: Record<string, any>
) => {
  const { __PROD__ } = getEnv()
  const styleLoader: RuleSetUseItem[] = [
    __PROD__ ? styleMinifyLoader : 'style-loader',
    {
      loader: 'css-loader',
      options: cssOptions
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          ident: 'postcss',
          config: false,
          plugins: [
            'postcss-flexbugs-fixes',
            [
              'postcss-preset-env',
              {
                autoprefixer: {
                  flexbox: 'no-2009'
                },
                stage: 3
              }
            ],
            'postcss-normalize'
          ]
        }
      }
    }
  ]

  if (loader)
    styleLoader.push({
      loader,
      options: {
        ...lodaerOptions,
        sourceMap: true
      }
    })

  return styleLoader
}
