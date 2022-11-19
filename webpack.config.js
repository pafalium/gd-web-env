var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

/** @typedef {import('webpack').Configuration} Configuration */
/** @type {Configuration} */
module.exports = {

  mode: 'development',
  entry: {
    main: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: '**/*', context: path.resolve(__dirname, 'assets') }
      ]
    }),
    new MiniCssExtractPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: ['babel-loader']
      },
      {
        test: /.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  }

};
