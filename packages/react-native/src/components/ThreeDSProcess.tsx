import { useCallback, useEffect, useState } from "react";
import { usePoll3DSSession, getThreeDSSession } from "../hooks/usePoll3DSSession";
import { ThreeDSCallbacks, ThreeDSSessionResponse } from "../types";
import * as WebBrowser from 'expo-web-browser';

interface ThreeDSProcessProps {
  sessionId: string;
  appId: string;
  teamId: string;
  callbacks: ThreeDSCallbacks;
}

const ev3DSDomain =
  process.env.THREE_D_S_REDIRECTION_DOMAIN ||
  'e0d6-2a09-bac5-37b9-ebe-00-178-198.ngrok-free.app';

export const ThreeDSProcess = ({ sessionId, appId, teamId, callbacks }: ThreeDSProcessProps) => {
  const [startPolling, setStartPolling] = useState(false);
  const [browserOpened, setBrowserOpened] = useState(false);

  // Callbacks wrapped in useCallback to ensure stable references
  const handleSuccess = useCallback(() => {
    console.log('3DS process succeeded');
    setStartPolling(false);
    callbacks.onSuccess();
  }, [callbacks]);

  const handleFailure = useCallback((error: Error) => {
    console.log('3DS process failed', error);
    setStartPolling(false);
    callbacks.onFailure(error);
  }, [callbacks]);

  const handleCanceled = useCallback(() => {
    console.log('3DS process canceled');
    setStartPolling(false);
    callbacks.onCanceled();
  }, [callbacks]);

  // Only start polling if startPolling is true
  usePoll3DSSession({
    sessionId,
    appId,
    delay: 7000,
    callbacks: {
      onSuccess: handleSuccess,
      onFailure: handleFailure,
      onCanceled: handleCanceled,
    },
    startPolling, // Controlled by the startPolling state
  });

  useEffect(() => {
    const startThreeDS = async () => {
      console.log(`Starting 3DS process. Session ID: ${sessionId}, App ID: ${appId}, Team ID: ${teamId}`);
      try {
        const initialStatus = await getThreeDSSession(sessionId, appId);
        console.log('Initial 3DS status:', initialStatus);

        if (initialStatus.status === 'success') {
          handleSuccess();
          return;
        }

        if (initialStatus.status === 'failure') {
          handleFailure(new Error(`3DS failed. Failure reason: ${initialStatus.failureReason}`));
          return;
        }

        if (initialStatus.status === 'action-required') {
          console.log('Starting polling of session status');
          setStartPolling(true);

          if (!browserOpened) {
            console.log('Opening 3DS challenge in browser');
            setBrowserOpened(true);
            const result = await WebBrowser.openBrowserAsync(
              `https://${ev3DSDomain}/challenge?session=${sessionId}&team=${teamId}&app=${appId}`,
              {
                dismissButtonStyle: 'cancel',
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
              }
            );
            console.log('Browser result:', result);

            if (result.type === 'cancel') {
              console.log('3DS challenge was canceled');
              handleCanceled();
            }
          }
        }
      } catch (error) {
        console.error('Error in startThreeDS:', error);
        handleFailure(error instanceof Error ? error : new Error('Unknown error occurred'));
      }
    };

    startThreeDS();
  }, [sessionId, appId, teamId, browserOpened, handleSuccess, handleFailure, handleCanceled]);

  return null;
};
