const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  context: path.resolve(__dirname),
  target: 'node',
  externals: [nodeExternals()],
  devtool: false,
  plugins: [new webpack.SourceMapDevToolPlugin({
    filename: '[name].js.map',
    exclude: ['vendor.js'],
  }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        include: [path.resolve(__dirname, 'src')],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  node: {
    __filename: true,
    __dirname: true,
  },
};
