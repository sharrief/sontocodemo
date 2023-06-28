// @ts-check
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  resolve: {
    fallback: {
      process: require.resolve('process/browser'),
      zlib: require.resolve('browserify-zlib'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util'),
      buffer: require.resolve('buffer'),
      asset: require.resolve('assert'),
    },
    plugins: [new TsconfigPathsPlugin.TsconfigPathsPlugin({ configFile: 'tsconfig.client.json', extensions: ['.js', '.jsx', '.ts', '.tsx'] })],
  },
  entry: {
    dashboard: './src/client/js/dashboard/index.tsx',
    login: './src/client/js/login/index.tsx',
    passwordReset: './src/client/js/passwordReset/index.tsx',
    application: './src/client/js/application/index.tsx',
    sketchy: './src/client/js/themes/sketchy/index.tsx',
    sandstone: './src/client/js/themes/sandstone/index.tsx',
    vapor: './src/client/js/themes/vapor/index.tsx',
    darkly: './src/client/js/themes/darkly/index.tsx',
  },
  output: {
    path: path.join(__dirname, 'build/static'),
    publicPath: '/static',
    filename: '[name].js',
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new HtmlWebPackPlugin({
      template: './src/client/html/template.html',
      chunks: ['dashboard'],
      filename: './dashboard.html',
      favicon: './src/client/images/favicon.png',
    }),
    new HtmlWebPackPlugin({
      template: './src/client/html/template.html',
      chunks: ['login'],
      filename: './login.html',
      favicon: './src/client/images/favicon.png',
    }),
    new HtmlWebPackPlugin({
      template: './src/client/html/template.html',
      chunks: ['passwordReset'],
      filename: './passwordReset.html',
      favicon: './src/client/images/favicon.png',
    }),
    new HtmlWebPackPlugin({
      template: './src/client/html/template.html',
      chunks: ['application'],
      filename: './application.html',
      favicon: './src/client/images/favicon.png',
    }),
  ],
};
