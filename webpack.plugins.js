const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new HtmlWebpackPlugin({
    template: 'src/renderer/index.html',
    filename: 'main_window/index.html',
    chunks: ['main_window'],
  }),
  new HtmlWebpackPlugin({
    template: 'src/renderer/widget.html',
    filename: 'widget_window/index.html',
    chunks: ['widget_window'],
  }),
]; 