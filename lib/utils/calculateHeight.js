module.exports = function (settings) {
  if (settings) {
    if (settings.height) {
      return settings.height;
    }
    if (settings.theme === "minimal" || settings.theme === "material") {
      return "145px";
    }
  }
  return "180px";
};
