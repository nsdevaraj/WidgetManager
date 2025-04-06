import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';

export const preloadConfig: Configuration = {
  entry: './electron/preload.ts',
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  target: 'electron-preload',
  output: {
    filename: 'preload.js',
  },
}; 