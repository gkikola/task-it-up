const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const mode = (argv.mode === 'development') ? 'development' : 'production';
  const styleLoader = mode === 'development'
    ? 'style-loader' : MiniCssExtractPlugin.loader;

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
      new webpack.DefinePlugin({
        PACKAGE_VERSION: JSON.stringify(require('./package.json').version),
      }),
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
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    useBuiltIns: 'usage',
                    corejs: '3.20',
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
