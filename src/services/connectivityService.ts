import { useState, useEffect } from 'react';

/**
 * Checks real network connectivity with a fast HEAD request and short timeout
 */
export async function checkRealConnectivity(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // Ping lightweight asset with cache-busting
    const response = await fetch(`/manifest.json?_ping=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export function useConnectivity(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      const realOnline = await checkRealConnectivity();
      if (isMounted) {
        setIsOnline(realOnline);
      }
    };

    // Verify immediately
    verify();

    const handleOnline = () => {
      verify();
    };

    const handleOffline = () => {
      if (isMounted) setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat verification every 30s
    const intervalId = setInterval(verify, 30000);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
}
