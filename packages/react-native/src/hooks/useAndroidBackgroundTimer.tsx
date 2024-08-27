import { BackgroundTimer } from '../native';
import { useEffect } from 'react';

export function useAndroidBackgroundTimer(callback: any, delay: any) {
  useEffect(() => {
    if (typeof delay === 'number') {
      BackgroundTimer.startBackgroundTimer(delay, callback);

      return () => BackgroundTimer.stopBackgroundTimer();
    }
    return () => {};
  }, [callback, delay]);

  return null;
}

export default useAndroidBackgroundTimer;