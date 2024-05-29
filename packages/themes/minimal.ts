import type { ThemeDefinition } from "types";

export function minimal(extended?: ThemeDefinition): ThemeDefinition {
  return (utils) => ({
    styles: {
      body: {
        paddingBottom: 2,
      },

      label: {
        fontSize: 14,
        marginBottom: "0.5rem",
        color: "#0a2540",
        display: "none",
      },

      ".field:first-child label": {
        display: "block",
      },

      "fieldset[ev-valid=false]": {
        paddingBottom: "1.5rem",
      },

      input: {
        height: 40,
        fontSize: 16,
        borderRadius: 0,
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
        borderRadius: 0,
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
        },
      },

      ".field[ev-valid=false] input": {
        color: "#df1c41",
        borderColor: "#df1c41",
      },

      ".error": {
        color: "#df1c41",
        fontSize: "0.75rem",
        padding: "0.25rem 0",
        position: "absolute",
        left: 0,
        bottom: 0,
        display: "none",
      },

      ".field[ev-valid=false]": {
        zIndex: 4,
      },

      ".field:focus-within": {
        zIndex: 5,
      },

      "[ev-component=card]": {
        gap: 0,

        "& .field[ev-valid=false]:nth-child(1) .error": {
          display: "block",
        },

        "& [ev-valid=true]:nth-child(1) + [ev-valid=false] .error": {
          display: "block",
        },

        "& [ev-valid=true]:nth-child(1) + [ev-valid=true]:nth-child(2) + [ev-valid=false] .error":
          {
            display: "block",
          },

        "& [ev-valid=true]:nth-child(1) + [ev-valid=true]:nth-child(2) + [ev-valid=true]:nth-child(3) + [ev-valid=false] .error":
          {
            display: "block",
          },

        "& .field:not(:last-child)": {
          marginBottom: "-1px",
        },

        "& .field:first-child": {
          "& input": {
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
          },
        },

        "& .field:last-child": {
          "& input": {
            borderBottomRightRadius: 6,
            borderBottomLeftRadius: 6,
          },
        },
      },

      "[ev-component=card][ev-fields*=cvc][ev-fields*=expiry]": {
        "& .field[ev-name=expiry]": {
          "& input": {
            borderBottomLeftRadius: 6,
          },
        },

        "& .field[ev-name=cvc]": {
          marginLeft: "-1px",

          "& input": {
            borderBottomLeftRadius: 0,
          },
        },
      },

      "[ev-component=pin]": {
        gap: 0,

        "& input": {
          height: 60,
        },

        "& .field:not(:first-child)": {
          marginLeft: "-1px",
        },

        "& .field:first-child input": {
          borderTopLeftRadius: 6,
          borderBottomLeftRadius: 6,
        },

        "& .field:last-child input": {
          borderTopRightRadius: 6,
          borderBottomRightRadius: 6,
        },
      },

      ...(extended ? utils.extend(extended) : {}),
    },
  });
}
