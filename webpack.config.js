const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const package = require('./package.json');

module.exports = (env, argv) => {
  const mode = (argv.mode === 'development') ? 'development' : 'production';
  const styleLoader = mode === 'development'
    ? 'style-loader' : MiniCssExtractPlugin.loader;

  // Set up compile-time defines
  const authorInfo = package.author.match(/^(.*?)( <(.*)>)?( \((.*)\))?$/);
  const definePluginOpts = {
    PACKAGE_NAME: JSON.stringify(package.name),
    PACKAGE_VERSION: JSON.stringify(package.version),
    PACKAGE_AUTHOR: JSON.stringify(package.author),
    PACKAGE_AUTHOR_NAME: JSON.stringify(authorInfo[1]),
    PACKAGE_AUTHOR_EMAIL: JSON.stringify(authorInfo[3] ?? null),
    PACKAGE_AUTHOR_WEBSITE: JSON.stringify(authorInfo[5] ?? null),
  };

  // Base configuration
  const config = {
    entry: './src/index.js',
    mode,
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/template.ejs',
        title: 'Task It Up',
      }),
      new MiniCssExtractPlugin(),
      new webpack.DefinePlugin(definePluginOpts),
    ],
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.m?js$/i,
          exclude: /node_modules[\\\/](?!(events|semver|lru-cache))[\\\/]/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    useBuiltIns: 'entry',
                    corejs: '3.23',
                  },
                ],
              ],
              plugins: ['lodash'],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [
            styleLoader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['postcss-preset-env'],
                  ],
                },
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    optimization: {
      minimizer: ['...', new CssMinimizerPlugin()],
    },
  };

  // Add development options if needed
  if (mode === 'development') {
    Object.assign(config, {
      devtool: 'inline-source-map',
      devServer: {
        static: './dist',
      },
    });
  }

  return config;
};
