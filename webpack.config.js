const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env = {}) => {
  const buildTarget = env.target === 'web' ? 'web' : 'electron-renderer';

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html'
      }),
      ...(buildTarget === 'web'
        ? [new CopyWebpackPlugin({
            patterns: [
              { from: 'config.xml', to: '.', noErrorOnMissing: true }
            ]
          })]
        : []),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer']
      })
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallback: buildTarget === 'web' ? {
        buffer: require.resolve('buffer/')
      } : {}
    },
    target: buildTarget,
    devServer: buildTarget === 'web' ? {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      port: 5173,
      open: false,
      hot: true,
      client: {
        overlay: true
      }
    } : undefined
  };
};

