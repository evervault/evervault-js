import type { ThemeDefinition } from "types";
import { withPresetConfig, type PresetConfig } from "./presetConfig";

export function clean(
  extended?: ThemeDefinition,
  config?: PresetConfig
): ThemeDefinition {
  return (utils) => ({
    styles: {
      ...withPresetConfig(
        {
          ":root": {
            "--icon-offset": "1.9rem",
          },
          body: {
            paddingBottom: 2,
            fontFamily: "var(--ev-font-family, inherit)",
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
            borderRadius: "var(--ev-roundness, 6px)",
            color: "#0a2540",
            padding: "0 12px",
            backgroundColor: "#fff",
            border: "1px solid #e6ebf1",
            boxShadow:
              "0px 1px 1px rgba(0, 0, 0, .03), 0px 3px 6px rgba(0, 0, 0, .02)",

            "&::placeholder": {
              color: "var(--ev-grey-tone, #717f96)",
            },

            "&:focus": {
              outline: "none",
              borderColor: "var(--ev-color-primary, #63e)",
            },
          },
          textarea: {
            height: 40,
            fontSize: 16,
            borderRadius: "var(--ev-roundness, 6px)",
            color: "#0a2540",
            padding: "6px 12px",
            backgroundColor: "#fff",
            border: "1px solid #e6ebf1",

            boxShadow:
              "0px 1px 1px rgba(0, 0, 0, .03), 0px 3px 6px rgba(0, 0, 0, .02)",

            "&::placeholder": {
              color: "var(--ev-grey-tone, #717f96)",
            },

            "&:focus": {
              outline: "none",
              borderColor: "var(--ev-color-primary, #63e)",
            },
          },
          select: {
            height: 40,
            fontSize: 16,
            borderRadius: "var(--ev-roundness, 6px)",
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
          "[ev-component=card]:has(.icon)": {
            "& .field[ev-name=number]": {
              position: "relative",
            },
            "& .icon": {
              left: 10,
              height: 20,
              position: "absolute",
              top: "var(--icon-offset)",
            },
            "& .field[ev-name=number] input": {
              paddingLeft: 48,
            },
          },
        },
        config
      ),
      ...(extended ? utils.extend(extended) : {}),
    },
  });
}
