const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  entry: {
    main_window: './src/renderer/index.tsx',
    widget_window: './src/renderer/widget.tsx',
  },
  output: {
    filename: '[name].js',
  },
}; 