// @ts-check
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
// const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const autoprefixer = require('autoprefixer');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const config = require('./webpack.config');

// const smp = new SpeedMeasurePlugin();

module.exports = merge(config,
  {
    mode: 'development',
    devtool: 'source-map',
    resolve: {
      alias: {
        'react-dom': '@hot-loader/react-dom',
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/,
          use: [
            {
              loader: 'ts-loader',
              options: { configFile: 'tsconfig.client.json', transpileOnly: true },
            },
          ],
          exclude: /node_modules/,
        },
        {
          // Loads the javascript into html template provided.
          // Entry point is set below in HtmlWebPackPlugin in Plugins
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
            },
          ],
        },
        {
          // Loads images into CSS and Javascript files
          test: /\.(jpe?g|png|gif|svg|pdf)$/i,
          use: ['file-loader'],
        },
        {
          test: /\.(s*)css$/i,
          use: [
            // {
            //   loader: 'style-loader', // inject CSS to page
            //   options: {
            //     attributes: { id: '[name]' },
            //   },
            // },
            { loader: MiniCssExtractPlugin.loader },

            {
              loader: 'css-loader', // translates CSS into CommonJS modules
            }, {
              loader: 'postcss-loader', // Run post css actions
              options: {
                plugins() { // post css plugins, can be exported to postcss.config.js
                  return [
                    autoprefixer,
                  ];
                },
              },
            }, {
              loader: 'sass-loader', // compiles Sass to CSS
              options: {
                // Prefer `dart-sass`
                implementation: require('sass'),
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
      new ForkTsCheckerWebpackPlugin({ typescript: { configFile: 'tsconfig.client.json', memoryLimit: 4096 } }),
      new BundleAnalyzerPlugin(),
    ],
    devServer: {
      host: '0.0.0.0',
      port: 3001,
      hot: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
      devMiddleware: {
        writeToDisk: true,
      },
    },
    output: {
      publicPath: '/static/', // During development webpack-dev-server serves hot files on diff port than express
      pathinfo: false,
    },
  });
