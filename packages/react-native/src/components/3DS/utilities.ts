import { ThreeDSSessionResponse } from "./types";

export const EV_API_DOMAIN = process.env.EV_API_DOMAIN || 'api.evervault.com';
export const THREE_D_S_CHALLENGE_DOMAIN = 'c713-2a09-bac5-3a69-ebe-00-178-198.ngrok-free.app';

export const getThreeDSSession = async (
    sessionId: string,
    appId: string
  ): Promise<ThreeDSSessionResponse> => {
    try {
      console.log(`Fetching 3DS session. Session ID: ${sessionId}, App ID: ${appId}`);
      const response = await fetch(
        `https://${EV_API_DOMAIN}/frontend/3ds/browser-sessions/${sessionId}`,
        {
          headers: {
            'x-evervault-app-id': appId,
          },
        }
      );

      const result = response.json() as Promise<ThreeDSSessionResponse>;
      return result;
    } catch (error) {
      console.error('Error fetching session status', error);
      throw error;
    }
  };