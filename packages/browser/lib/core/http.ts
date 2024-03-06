import { errors } from "../utils";
import type { HttpConfig, SdkContext } from "../config";

export interface CageKey {
  teamUuid: string;
  appUuid: string;
  key: string;
  ecdhKey: string;
  ecdhP256Key: string;
  ecdhP256KeyUncompressed: string;
  isDebugMode: boolean;
}

export interface TargetElement {
  elementType: string;
  elementName: string;
}

export interface Form {
  uuid: string;
  targetElements: TargetElement[];
  appUuid: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export default function Http(
  config: HttpConfig,
  teamId: string,
  appId: string,
  context: SdkContext
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

  async function getCageKey(): Promise<CageKey> {
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

      const body = (await response.json()) as CageKey;
      const { headers } = response;

      return {
        ...body,
        isDebugMode: headers.get("X-Evervault-Inputs-Debug-Mode") === "true",
      };
    } catch (err) {
      throw new errors.CageKeyError(
        "An error occurred while retrieving the apps key",
        { cause: err }
      );
    }
  }

  async function decryptWithToken<T>(
    token: string,
    data: T
  ): Promise<{ value: T }> {
    try {
      const response = await fetch(`${config.apiUrl}/decrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const body = (await response.json()) as { value: T };
      return body;
    } catch (err) {
      throw new errors.DecryptError(
        "An error occurred while decrypting the data",
        { cause: err }
      );
    }
  }

  async function getAppForms(): Promise<Form[]> {
    try {
      const formEndpoint = new URL(
        `forms`,
        config.apiUrl
      );

      const response = await fetch(formEndpoint, {
        method: "GET",
        headers: {
          "x-evervault-app-id": appId,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const body = (await response.json()) as Form[];
      return body;
    } catch (err) {
      throw new errors.FormError(
        "An error occurred while retrieving the apps forms",
        { cause: err }
      );
    }
  }


  return { getCageKey, decryptWithToken, getAppForms };
}
