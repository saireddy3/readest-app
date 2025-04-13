import { create } from 'zustand';
import { AppService } from '@/types/system';

interface TrafficLightState {
  appService?: AppService;
  isTrafficLightVisible: boolean;
  shouldShowTrafficLight: boolean;
  initializeTrafficLightStore: (appService: AppService) => void;
  setTrafficLightVisibility: (visible: boolean) => void;
  initializeTrafficLightListeners: () => Promise<void>;
  cleanupTrafficLightListeners: () => void;
  unlistenEnterFullScreen?: () => void;
  unlistenExitFullScreen?: () => void;
}

export const useTrafficLightStore = create<TrafficLightState>((set, get) => {
  return {
    appService: undefined,
    isTrafficLightVisible: false,
    shouldShowTrafficLight: false,

    initializeTrafficLightStore: (appService: AppService) => {
      set({
        appService,
        isTrafficLightVisible: appService.hasTrafficLight,
        shouldShowTrafficLight: appService.hasTrafficLight,
      });
    },

    setTrafficLightVisibility: async (visible: boolean) => {
      // In web mode, we check if we're in fullscreen using the browser API
      const isFullscreen = !!document.fullscreenElement;
      set({ isTrafficLightVisible: !isFullscreen && visible, shouldShowTrafficLight: visible });
      // No need to invoke native code in web environment
    },

    initializeTrafficLightListeners: async () => {
      // Use standard web event listeners for fullscreen changes
      const handleEnterFullScreen = () => {
        set({ isTrafficLightVisible: false });
      };

      const handleExitFullScreen = () => {
        const { shouldShowTrafficLight } = get();
        set({ isTrafficLightVisible: shouldShowTrafficLight });
      };

      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          handleEnterFullScreen();
        } else {
          handleExitFullScreen();
        }
      });

      // Return cleanup functions
      const unlistenEnterFullScreen = () => {
        document.removeEventListener('fullscreenchange', handleEnterFullScreen);
      };

      const unlistenExitFullScreen = () => {
        document.removeEventListener('fullscreenchange', handleExitFullScreen);
      };

      set({ unlistenEnterFullScreen, unlistenExitFullScreen });
    },

    cleanupTrafficLightListeners: () => {
      const { unlistenEnterFullScreen, unlistenExitFullScreen } = get();
      if (unlistenEnterFullScreen) unlistenEnterFullScreen();
      if (unlistenExitFullScreen) unlistenExitFullScreen();
      set({ unlistenEnterFullScreen: undefined, unlistenExitFullScreen: undefined });
    },
  };
});
