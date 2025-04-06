const rules = require('./webpack.rules');
const webpack = require('webpack');

module.exports = {
  entry: {
    'main-preload': ['./src/main/preload.ts'],
    'widget-preload': ['./src/main/widget-preload.ts'],
  },
  target: 'electron-preload',
  output: {
    filename: '[name].js',
    path: require('path').resolve(__dirname, '.webpack/main'),
  },
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    fallback: {
      "events": require.resolve("events/"),
      "util": require.resolve("util/"),
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
    }
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: {
    electron: 'commonjs electron'
  }
}; 