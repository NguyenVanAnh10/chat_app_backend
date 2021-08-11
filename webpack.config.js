const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { SourceMapDevToolPlugin } = require('webpack');

const config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  target: 'node',
  externals: [nodeExternals()],
  resolve: {
    modules: ['src'],
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        include: [path.resolve(__dirname, 'src')],
        use: {
          loader: 'ts-loader',
        },
      },
    ],
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'source-map';
    config.plugins = [
      new SourceMapDevToolPlugin({
        filename: '[name].js.map',
        exclude: ['vendor.js'],
      }),
    ];
  }

  return config;
};
