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
    PACKAGE_LICENSE: JSON.stringify(package.license),
    PACKAGE_HOMEPAGE: JSON.stringify(package.homepage),
  };

  // Base configuration
  const config = {
    entry: {
      main: './src/index.js',
      licenses: './src/licenses.js',
    },
    mode,
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/template.ejs',
        title: 'Task It Up',
        chunks: ['main'],
      }),
      new HtmlWebpackPlugin({
        template: './src/template.ejs',
        title: 'Licenses - Task It Up',
        filename: '[name].html',
        chunks: ['licenses'],
      }),
      new MiniCssExtractPlugin(),
      new webpack.DefinePlugin(definePluginOpts),
    ],
    output: {
      filename: '[name].[contenthash].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.m?js$/i,
          include: (resource) => {
            const includedPackages = [
              'events',
            ];

            const match = resource.match(/node_modules[\\\/](.*?)[\\\/]/);

            // Exclude only non-whitelisted dependencies
            return !match || includedPackages.includes(match[1]);
          },
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    useBuiltIns: 'usage',
                    corejs: '3.23',
                  },
                ],
              ],
              sourceType: 'unambiguous',
              plugins: ['lodash'],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [styleLoader, 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.txt$/i,
          type: 'asset/source',
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
