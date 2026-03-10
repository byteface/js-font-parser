// webpack.config.cjs
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.ts', // Your entry point
  devtool: false,
  performance: {
    hints: false,
  },
  output: {
    filename: 'fontparser.min.js',
    path: path.resolve(__dirname, 'dist-build'),
    library: 'FontParser',
    libraryTarget: 'umd',
    globalObject: 'this', // To support Node.js and browser
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: {
            passes: 2,
            pure_getters: true,
          },
          mangle: true,
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};
