module.exports = {
  source: "src",
  output: "dist",
  typescript: [
    {
      project: "tsconfig.build.json",
    },
  ],
  targets: [
    "module",
    "commonjs",
    [
      "typescript",
      {
        project: "tsconfig.build.json",
      },
    ],
  ],
};
