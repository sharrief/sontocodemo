// @ts-check
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
// import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
const autoprefixer = require('autoprefixer');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const config = require('./webpack.config');

// const smp = new SpeedMeasurePlugin();

module.exports = merge(config,
  {
    mode: 'development',
    devtool: 'cheap-module-eval-source-map',
    resolve: {
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
            {
              loader: 'style-loader', // inject CSS to page
            }, {
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
      new ForkTsCheckerWebpackPlugin({ typescript: { configFile: 'tsconfig.client.json', memoryLimit: 4096 } }),
    ],
    output: {
      pathinfo: false,
    },
  });
