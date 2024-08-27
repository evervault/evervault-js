import { useEffect, useRef, useState } from "react";
import * as WebBrowser from 'expo-web-browser';
import { ThreeDSCallbacks, ThreeDSSessionResponse } from "../types"
import { Platform } from "react-native";
import { BackgroundTimer } from '../native';
import { NativeEventEmitter, NativeModules } from 'react-native';


interface Poll3DSSessionProps {
    sessionId: string;
    appId: string;
    delay: number;
    callbacks: ThreeDSCallbacks;
    startPolling: boolean;
}

const evApiDomain = process.env.EV_API_DOMAIN || 'api.evervault.com';

export const getThreeDSSession = async (
    sessionId: string,
    appId: string
  ): Promise<ThreeDSSessionResponse> => {
    try {
      console.log(`Fetching 3DS session. Session ID: ${sessionId}, App ID: ${appId}`);
      const response = await fetch(
        `https://${evApiDomain}/frontend/3ds/browser-sessions/${sessionId}`,
        {
          headers: {
            'x-evervault-app-id': appId,
          },
        }
      );

      const result = response.json() as Promise<ThreeDSSessionResponse>;
      console.log(`3DS Session: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      console.error('Error fetching session status', error);
      throw error;
    }
  };

  export function usePoll3DSSession({ sessionId, appId, delay, callbacks }: Poll3DSSessionProps) {
    const intervalRef = useRef<number | null>(null);
    const taskCountRef = useRef(0);
  
    const stopPolling = () => {
      if (Platform.OS === 'android') {
        console.log('[JAVASCRIPT-ABC] Stopping 3DS polling (Android)');
        BackgroundTimer.stopBackgroundTimer();
      } else if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  
    const handleError = (error: Error) => {
      console.error('[JAVASCRIPT-ABC] Error polling 3DS status', error);
      callbacks.onFailure(error);
      stopPolling();
    };
  
    const task = async () => {
      taskCountRef.current += 1;
      console.log(`[JAVASCRIPT-ABC] Starting task execution #${taskCountRef.current}`);
  
      try {
        const threeDSSession = await getThreeDSSession(sessionId, appId);
        console.log(`[JAVASCRIPT-ABC] 3DS status: ${threeDSSession.status}`);
  
        if (threeDSSession.status !== 'action-required') {
          WebBrowser.dismissBrowser();
          threeDSSession.status === 'success' ? callbacks.onSuccess() : callbacks.onFailure(new Error('3DS failed'));
          stopPolling();
        } else {
          console.log(`[JAVASCRIPT-ABC] 3DS Session still in action-required state: ${JSON.stringify(threeDSSession)}`);
        }
      } catch (error) {
        handleError(error as Error);
      }
  
      console.log(`[JAVASCRIPT-ABC] Finished task execution #${taskCountRef.current}`);
    };
  
    useEffect(() => {
      console.log('[JAVASCRIPT-ABC] Initializing 3DS polling');
  
      if (Platform.OS === 'android') {
        const eventEmitter = new NativeEventEmitter(NativeModules.BackgroundTimer);
        const eventListener = eventEmitter.addListener('backgroundTimer', task);
        BackgroundTimer.startBackgroundTimer(delay);
  
        return () => {
          console.log('[JAVASCRIPT-ABC] Cleaning up 3DS polling (Android)');
          BackgroundTimer.stopBackgroundTimer();
          eventListener.remove();
        };
      } else {
        intervalRef.current = window.setInterval(task, delay);
  
        return () => {
          console.log('[JAVASCRIPT-ABC] Cleaning up 3DS polling (iOS/JS)');
          stopPolling();
        };
      }
    }, []);
  
    return null;
  }