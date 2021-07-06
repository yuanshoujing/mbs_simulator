const path = require("path");

module.exports = {
  mode: "development", // or 'production'

  entry: "./src/main.js",

  devtool: "inline-source-map",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },

  target: "node",
};
