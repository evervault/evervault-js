import { ThemeDefinition } from "@evervault/react";

export const theme: ThemeDefinition = {
  styles: {
    label: {
      display: "block",
      color: "#00272B",
      marginBottom: 10,
    },

    input: {
      padding: 15,
      fontSize: 18,
      outline: "none",
      borderRadius: 8,
      border: "2px solid #ccc",

      "&:focus": {
        borderColor: "#005860",
      },

      "&::placeholder": {
        color: "#aaa",
      },
    },

    ".error": {
      color: "#B94B2F",
      marginTop: 10,
      marginBottom: 10,
      fontSize: 14,
    },

    "fieldset[ev-component='card']": {
      gap: 20,
    },
  },
};
