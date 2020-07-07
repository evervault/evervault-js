/** @format */

const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    filename: 'v1.js',
    path: path.resolve(__dirname, '..', '..', 'dist'),
    library: 'Evervault',
    libraryTarget: 'window',
    umdNamedDefine: true,
  },
};