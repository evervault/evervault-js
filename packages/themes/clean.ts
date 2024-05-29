import type { ThemeDefinition } from "types";

export function clean(extended?: ThemeDefinition): ThemeDefinition {
  return (utils) => ({
    styles: {
      body: {
        paddingBottom: 2,
      },
      label: {
        fontSize: 14,
        marginBottom: 4,
        display: "block",
        color: "#0a2540",
      },
      input: {
        height: 40,
        fontSize: 16,
        borderRadius: 6,
        color: "#0a2540",
        padding: "0 12px",
        backgroundColor: "#fff",
        border: "1px solid #e6ebf1",

        boxShadow:
          "0px 1px 1px rgba(0, 0, 0, .03), 0px 3px 6px rgba(0, 0, 0, .02)",

        "&::placeholder": {
          color: "#717f96",
        },

        "&:focus": {
          outline: "none",
          borderColor: "#63e",
        },
      },
      textarea: {
        height: 40,
        fontSize: 16,
        borderRadius: 6,
        color: "#0a2540",
        padding: "6 12px",
        backgroundColor: "#fff",
        border: "1px solid #e6ebf1",

        boxShadow:
          "0px 1px 1px rgba(0, 0, 0, .03), 0px 3px 6px rgba(0, 0, 0, .02)",

        "&::placeholder": {
          color: "#717f96",
        },

        "&:focus": {
          outline: "none",
          borderColor: "#63e",
        }
      },
      select: {
        height: 40,
        fontSize: 16,
        borderRadius: 6,
        color: "#0a2540",
        padding: "6px 12px",
        backgroundColor: "#fff",
        border: "1px solid #e6ebf1",
      },
      button: {
        fontSize: 16,
        height: 40,
        border: "1px solid #e6ebf1",
        padding: "0 12px",
      },
      ".field[ev-valid=false] input": {
        color: "#df1c41",
        borderColor: "#df1c41",
      },
      ".error": {
        color: "#df1c41",
        fontSize: "0.75rem",
        padding: "0.25rem 0",
      },
      "[ev-component=card]": {
        gap: 16,
      },
      "[ev-component=pin] input": {
        height: 80,
        fontSize: 20,
        caretColor: "transparent",
      },
      ...(extended ? utils.extend(extended) : {}),
    },
  });
}
