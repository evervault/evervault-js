import type { ThemeDefinition } from "types";

export function material(extended?: ThemeDefinition): ThemeDefinition {
  return (utils) => ({
    styles: {
      body: {
        paddingTop: 4,
      },

      ".field": {
        position: "relative",
      },

      label: {
        top: 10,
        left: 8,
        zIndex: 3,
        fontSize: 14,
        lineHeight: 1,
        height: "20px",
        display: "flex",
        color: "#717f96",
        padding: "0 4px",
        alignItems: "center",
        position: "absolute",
        pointerEvents: "none",
        transformOrigin: "center left",
        transition: "transform 150ms, background 150ms",
      },

      input: {
        height: 40,
        fontSize: 16,
        borderRadius: 6,
        color: "#0a2540",
        padding: "0 12px",
        backgroundColor: "#fff",
        border: "1px solid #e6ebf1",

        "&::placeholder": {
          color: "transparent",
        },

        "&:focus": {
          outline: "none",
          borderColor: "#63e",
        },
      },

      ".field[ev-valid=false] input": {
        color: "#df1c41",
        borderColor: "#df1c41",
      },

      ".field:focus-within label, .field:not([ev-has-value=false]) label": {
        background: "white",
        transform: "translateY(-100%) scale(0.8)",
      },

      ".error": {
        color: "#df1c41",
        fontSize: "0.75rem",
        padding: "0.25rem 0",
      },

      ".field:not([ev-valid=false]):focus-within label": {
        color: "#63e",
      },

      ".field[ev-valid=false] label": {
        color: "#df1c41",
      },

      ".field[ev-has-value=true][ev-valid=true]:not(:focus-within) label": {
        color: "#0a2540",
      },

      "[ev-component=cardDetails]": {
        gap: 16,
      },
      ...(extended ? utils.extend(extended) : {}),
    },
  });
}
