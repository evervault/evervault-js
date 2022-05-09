module.exports = function (theme, styles) {
  if (styles && styles.height) {
    return styles.height;
  }
  if (theme === 'minimal' || theme === 'material') return '120px';
  return '160px';
};
