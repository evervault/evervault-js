const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

 module.exports = {
   entry: './src/index.js',
   plugins: [
     new HtmlWebpackPlugin({
       filename: 'index.html',
       template: 'src/index.html',
     }),
   ],
   output: {
     filename: 'bundle.js',
     path: path.resolve(__dirname, 'dist'),
   },
   devServer: {
     static: {
       directory: path.join(__dirname, 'dist')
     },
     compress: true,
     port: 9000,
   },
   module: {
     rules: [
       {
         test: /\.css$/i,
         use: [
           'style-loader',
           {
             loader: 'css-loader',
             options: {
               importLoaders: 1
             }
           },
           'postcss-loader'
         ]
       }
     ],
   },
 };