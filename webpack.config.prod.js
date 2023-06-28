// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const autoprefixer = require('autoprefixer');
const config = require('./webpack.config');

module.exports = merge(config,
  {
    mode: 'production',
    optimization: {
      minimize: true,
      minimizer: [
        // new TerserPlugin({
        //   parallel: false,
        // }),
        new CssMinimizerPlugin({}),
      ],
    },
    resolve: {
      ...config.resolve,
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
              options: { minimize: true },
            },
          ],
        },
        {
          test: /\.(jpe?g|png|gif|svg|pdf)$/i,
          use: ['url-loader'],
        },
        {
          // Loads CSS into a file when you import it via Javascript
          // Rules are set in MiniCssExtractPlugin
          test: /\.(s*)css$/i,
          use: [
            { loader: MiniCssExtractPlugin.loader },
            { loader: 'css-loader' },
            {
              loader: 'postcss-loader',
              options: {
                plugins() { // post css plugins, can be exported to postcss.config.js
                  return [
                    autoprefixer,
                  ];
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
              // Prefer `dart-sass`
                // eslint-disable-next-line global-require
                implementation: require('sass'),
              },
            },

          ],
        },
        {
          test: /\.js$/,
          loader: 'webpack-remove-debug', // remove "debug" package
        },
      ],
    },
    plugins: [
      ...config.plugins,
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
    ],
    output: {
      ...config.output,
      pathinfo: false,
    },
  });
