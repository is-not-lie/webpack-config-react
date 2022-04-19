import path from 'path';
import fs from 'fs';
import { loader as styleMinifyLoader } from 'mini-css-extract-plugin';

import type { RuleSetUseItem } from 'webpack'

const appPath = fs.realpathSync(process.cwd());

export const resolve = (relativePath: string) => path.resolve(appPath, relativePath);

export const getEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  return {
    __PROD__: nodeEnv === 'production',
    __DEV__: nodeEnv === 'development'
  };
};

export const useStyleLoaders = (loader?: string, lodaerOptions?: Record<string, any>) => {
  const { __PROD__ } = getEnv();
  const styleLoader: RuleSetUseItem[] = [
    __PROD__ ? styleMinifyLoader : 'style-loader',
    {
      loader: 'css-loader',
      options: { importLoaders: loader ? 2 : 1, esModule: false }
    },
    {
      loader: 'postcss-loader',
      options: { postcssOptions: { plugins: ['postcss-preset-env'] } }
    }
  ];

  if (loader) styleLoader.push({ loader, options: { ...lodaerOptions } });

  return styleLoader
};
