/* eslint no-undef: 0 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildPath = './build/';
const PACKAGE = require('./package.json');
const title = "RWX Viewer v" + PACKAGE.version;

module.exports = {
  entry: ['./src/entry.js'],
  output: {
    path: path.join(__dirname, buildPath),
    filename: '[name].[fullhash].js'
  },
  resolve: {
    symlinks: true
  },
  mode: 'development',
  devServer: {
    allowedHosts: ["all"],
  },
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: 'babel-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      },{
        test: /\.(jpe?g|png|gif|svg|tga|glb|babylon|mtl|pcb|pcd|prwm|mat|mp3|ogg)$/i,
        use: 'file-loader',
        exclude: path.resolve(__dirname, './node_modules/')
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({'title': title})
  ]
};
