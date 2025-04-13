import { useEffect, useRef } from 'react';
import { isWebAppPlatform } from '@/services/environment';

export const useScreenWakeLock = (lock: boolean) => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');

          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
          });

          console.log('Wake lock acquired');
        }
      } catch (err) {
        console.info('Failed to acquire wake lock:', err);
      }
    };

    const releaseWakeLock = () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake lock released');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        releaseWakeLock();
      } else {
        requestWakeLock();
      }
    };

    const handleFocusChange = () => {
      if (document.hasFocus()) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    if (lock) {
      requestWakeLock();
    } else if (wakeLockRef.current) {
      releaseWakeLock();
    }

    // Use web standard APIs for handling visibility and focus changes
    if (lock) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocusChange);
      window.addEventListener('blur', handleFocusChange);
    }

    return () => {
      releaseWakeLock();
      if (lock) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocusChange);
        window.removeEventListener('blur', handleFocusChange);
      }
    };
  }, [lock]);
};
