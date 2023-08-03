import type { HttpConfig } from "../config";

import { errors } from "../utils";

export default function Http(
  config: HttpConfig,
  teamId: string,
  appId: string,
  context: string
) {
  if (window == null) {
    throw new errors.InitializationError(
      "`window` object not found. You cannot run this SDK outside of a browser environment."
    );
  }

  if (!("fetch" in window)) {
    throw new errors.InitializationError(
      "Your browser is outdated and does not support window.fetch(). Please upgrade it."
    );
  }

  const getCageKey = async () => {
    try {
      const keyEndpoint = new URL(
        `${teamId}/apps/${appId}?context=${context}`,
        config.keysUrl
      );

      const response = await fetch(keyEndpoint, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const body = await response.json();
      const headers = response.headers;

      return {
        ...body,
        isDebugMode: headers.get("X-Evervault-Inputs-Debug-Mode") === "true",
      };
    } catch (err) {
      throw new errors.CageKeyError(
        "An error occurred while retrieving the cage's key",
        { cause: err }
      );
    }
  };

  const decryptWithToken = async (token: string, data: any) => {
    try {
      const decryptEndpoint = new URL(
        `${teamId}/decrypt`,
        config.keysUrl
      );

      const response = await fetch(decryptEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "ExecutionToken " + token,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const body = await response.json();

      return body;
    } catch (err) {
      throw new errors.CageKeyError(
        "An error occurred while decrypting the data",
        { cause: err }
      );
    }
  };

  return { getCageKey, decryptWithToken };
}
