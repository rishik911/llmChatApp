import { useCallback, useEffect, useRef } from 'react';

const TICK_MS = 16;

function charsPerTick(bufLen: number): number {
  if (bufLen <= 20) return 1;
  if (bufLen <= 80) return 3;
  return Math.ceil(bufLen / 25);
}

interface Callbacks {
  onChar: (messageId: string, char: string) => void;
  onDone: (messageId: string) => void;
}

export function useStreamBuffer({ onChar, onDone }: Callbacks) {
  const bufRef = useRef('');
  const activeIdRef = useRef<string | null>(null);
  const networkDoneRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (messageId: string) => {
      stopInterval();
      bufRef.current = '';
      networkDoneRef.current = false;
      activeIdRef.current = messageId;

      intervalRef.current = setInterval(() => {
        const buf = bufRef.current;
        const id = activeIdRef.current;

        if (buf.length > 0 && id) {
          const n = charsPerTick(buf.length);
          const chunk = buf.slice(0, n);
          bufRef.current = buf.slice(n);
          for (const char of chunk) {
            onChar(id, char);
          }
        } else if (buf.length === 0 && networkDoneRef.current) {
          stopInterval();
          activeIdRef.current = null;
          if (id) onDone(id);
        }
      }, TICK_MS);
    },
    [onChar, onDone, stopInterval],
  );

  const enqueue = useCallback((text: string) => {
    bufRef.current += text;
  }, []);

  const markNetworkDone = useCallback(() => {
    networkDoneRef.current = true;
  }, []);

  const abort = useCallback(() => {
    stopInterval();
    bufRef.current = '';
    activeIdRef.current = null;
    networkDoneRef.current = false;
  }, [stopInterval]);

  return { start, enqueue, markNetworkDone, abort };
}
