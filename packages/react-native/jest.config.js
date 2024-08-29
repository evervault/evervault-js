/** @type {import('jest').Config} */
const config = {
  verbose: true,
  preset: "react-native",
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};

module.exports = config;
