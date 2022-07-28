/** @format */

const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "index.js"),
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "..", "..", "dist", "v2"),
    library: "Evervault",
    libraryTarget: "window",
    umdNamedDefine: true,
  },
};
