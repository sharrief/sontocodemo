// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const { config: load } = require('dotenv');
const Path = require('path');
const nodeExternals = require('webpack-node-externals');
const TTsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

load(); // loads environment variables from .env

module.exports = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = {};
  if (process.env.NODE_ENV === 'development') {
    if (process.env.WATCH_SERVER === 'true') config.watch = true;
    config.mode = 'development';
    config.devtool = 'source-map';
  } else {
    config.mode = 'production';
  }
  return {
    ...config,
    optimization: {
      minimize: false,
    },
    entry: { server: './src/server/server.ts' },
    resolve: {
      plugins: [new TTsconfigPathsPlugin.TsconfigPathsPlugin({ configFile: 'tsconfig.server.json' })],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    output: {
      ...config.output,
      path: Path.join(__dirname, 'build'),
      publicPath: '/',
      filename: '[name].js',
    },
    target: 'node',
    node: {
      global: true,
      __dirname: false,
      __filename: false,
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/,
          use: [
            {
              loader: 'ts-loader',
              options: { configFile: 'tsconfig.server.json' },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.pem/,
          use: [
            {
              loader: 'raw-loader',
            },
          ],
        },
      ],
    },
    externals: [nodeExternals()],
  };
};
