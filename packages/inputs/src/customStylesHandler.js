const supportedProperties = [
  {
    name: 'primaryColor',
    variable: '--color-primary',
  },
  {
    name: 'errorColor',
    variable: '--color-danger',
  },
  {
    name: 'labelColor',
    variable: '--label-color',
  },
  {
    name: 'inputBorderColor',
    variable: '--input-border-color',
  },
  {
    name: 'inputTextColor',
    variable: '--input-color',
  },
  {
    name: 'inputBackgroundColor',
    variable: '--input-background',
  },
  {
    name: 'inputPlaceholderColor',
    variable: '--input-placeholder',
  },
  {
    name: 'inputBorderRadius',
    variable: '--input-radius',
  },
  {
    name: 'inputHeight',
    variable: '--input-height',
  },
  {
    name: 'inputFontSize',
    variable: '--input-font-size'
  },
  {
    name: 'inputBoxShadow',
    variable: '--input-shadow'
  },
  {
    name: 'labelWeight',
    variable: '--label-weight'
  },
  {
    name: 'labelFontSize',
    variable: '--label-font-size'
  },
  {
    name: 'fontFamily',
    variable: '--ff'
  }
];

export default function(urlParams) {
  let root = document.documentElement;
  supportedProperties.forEach(({ name, variable }) => {
    const paramValue = urlParams.get(name);
    if (paramValue) {
      root.style.setProperty(variable, paramValue);
    }
  });
}
