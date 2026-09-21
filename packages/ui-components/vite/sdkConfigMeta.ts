import type { Plugin, ResolvedConfig } from "vite";
import {
  buildTimeSdkConfig,
  SDK_CONFIG_META_NAME,
} from "../src/utilities/sdkConfig";

export function sdkConfigMeta(): Plugin {
  let resolved: ResolvedConfig;

  return {
    name: "vite-plugin-evervault-sdk-config-meta",
    enforce: "pre" as const,

    configResolved(config) {
      resolved = config;
    },

    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: {
            name: SDK_CONFIG_META_NAME,
            content: JSON.stringify(buildTimeSdkConfig(resolved.env)),
          },
          injectTo: "head" as const,
        },
      ];
    },
  };
}
