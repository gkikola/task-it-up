const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const mode = (argv.mode === 'development') ? 'development' : 'production';

  // Base configuration
  const config = {
    entry: './src/index.js',
    mode,
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/template.ejs',
        title: 'Task It Up',
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
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
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
