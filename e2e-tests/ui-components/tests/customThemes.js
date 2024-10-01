export const inlineTheme = {
  fonts: [
    "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&amp;display=swap",
  ],
  styles: {
    body: {
      fontFamily: "Lato",
      "-webkit-font-smoothing": "antialiased",
    },
    "[ev-component=card]": {
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
    },
    "[ev-component=card] .field": {
      gridColumn: "1 / 3",
    },
    label: {
      fontSize: 14,
      fontWeight: 700,
      color: "black",
    },
    fieldset: {
      marginTop: 4,
    },
    ".field": {
      padding: "4px 0",
    },
    ".field input": {
      height: 38,
      marginBottom: 22,
      marginTop: 6,
      padding: "4px 12px",
      fontSize: 12,
      fontWeight: 400,
      fontFamily: "Lato",
      border: `1px solid black`,
      backgroundColor: "white",
      borderRadius: 2,
    },
    ".field input::placeholder": {
      color: "currentColor",
      opacity: 0.38,
    },
    ".field input:focus": {
      borderColor: "#DDDDDD",
    },
    ".field[ev-valid=false] input:not(:focus)": {
      borderColor: "blue",
    },
    ".field[ev-valid=false] input": {
      marginBottom: 0,
    },
    ".error": {
      fontSize: 12,
      color: "red",
      paddingTop: 6,
      letterSpacing: "0.0333333333em",
      fontWeight: 400,
      minHeight: 22,
    },
  },
};
