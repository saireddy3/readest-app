import { eventDispatcher } from './event';

// Web-based window functions

// Get window position data
export const getWindowLogicalPosition = (): { x: number; y: number } => {
  return { 
    x: window.screenX, 
    y: window.screenY 
  };
};

// Toggle fullscreen mode
export const handleToggleFullScreen = async (): Promise<void> => {
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(err => {
      console.error('Error exiting fullscreen:', err);
    });
  } else {
    await document.documentElement.requestFullscreen().catch(err => {
      console.error('Error entering fullscreen:', err);
    });
  }
};

// Close window/tab
export const handleClose = (): void => {
  window.close();
};

// Listen for beforeunload event (closest to window close request)
export const handleOnCloseWindow = (callback: () => void): (() => void) => {
  const handler = async (event: BeforeUnloadEvent) => {
    await callback();
    // Modern browsers ignore this and just show a generic message
    event.preventDefault();
    event.returnValue = '';
  };
  
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
};

// No exact web equivalent for these functions, but providing placeholder implementations
export const handleMinimize = (): void => {
  console.warn('Window minimize is not supported in web environments');
};

export const handleToggleMaximize = (): void => {
  console.warn('Window maximize is not supported in web environments');
};

export const handleSetAlwaysOnTop = (isAlwaysOnTop: boolean): void => {
  console.warn('Always on top is not supported in web environments');
};

export const getAlwaysOnTop = (): boolean => {
  return false; // Not supported in web
};

export const handleOnWindowFocus = (callback: () => void): (() => void) => {
  window.addEventListener('focus', callback);
  return () => window.removeEventListener('focus', callback);
};

export const quitApp = async (): Promise<void> => {
  await eventDispatcher.dispatch('quit-app');
  window.close();
}; 