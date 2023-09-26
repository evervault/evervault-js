module.exports = {
  root: true,
  extends: ["custom"],
  rules: {
    // bitwise is needed for crypto ops
    "no-bitwise": "off",
    "no-void": ["error", { allowAsStatement: true }],
  },
};
