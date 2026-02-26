// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.ts', // Your entry point
  output: {
    filename: 'fontparser.min.js',
    path: path.resolve(__dirname, 'dist-build'),
    library: 'FontParser',
    libraryTarget: 'umd',
    globalObject: 'this', // To support Node.js and browser
  },
  resolve: {
    extensions: ['.ts', '.js'],
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
};
