const { resolve }  = require("path");
const webpack = require('webpack');

/*Configuration following the https://webpack.js.org/concepts/ */
module.exports = {
  entry: "./src/index.js",
  output: {
    path: resolve(__dirname, "./dist"),
    filename: "bundle.js",
    publicPath: '/dist',
  }
}