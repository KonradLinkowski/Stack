const { resolve, join }  = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

/*Configuration following the https://webpack.js.org/concepts/ */
module.exports = {
  entry: "./src/index.js",
  output: {
    path: resolve(__dirname, "./dist"),
    filename: "bundle.js",
    publicPath: './',
  },
  devServer: {
    contentBase: join(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ]
}