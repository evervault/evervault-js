/** @format */

const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "lib", "index.js"),
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    library: "Evervault",
    libraryTarget: "window",
    umdNamedDefine: true,
  },
};
