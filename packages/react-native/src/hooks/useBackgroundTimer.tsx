import { useEffect, useRef } from 'react';

export function useBackgroundTimer(callback: () => void, delay: number | undefined) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    if (typeof delay === "number") {
      intervalRef.current = window.setInterval(tick, delay);
      return () => window.clearInterval(intervalRef.current as number);
    }
    return () => {};
  }, [delay]);

  return null;
}

export default useBackgroundTimer;
