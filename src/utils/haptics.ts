/**
 * Web-based implementation of haptics using Web Vibration API
 */

// Vibration types mapped to durations (in milliseconds)
const VIBRATION_PATTERNS = {
  success: [50],
  warning: [30, 30, 30],
  error: [100, 30, 100],
  heavy: [80],
  medium: [40],
  light: [15],
  selection: [20],
  soft: [10]
};

type ImpactType = keyof typeof VIBRATION_PATTERNS;

/**
 * Trigger haptic feedback if supported
 * @param type Type of haptic feedback
 */
export const impactFeedback = (type: ImpactType): void => {
  // Check if vibration is supported
  if ('vibrate' in navigator) {
    navigator.vibrate(VIBRATION_PATTERNS[type]);
  }
};

/**
 * Check if haptics are supported in the current browser
 */
export const isHapticsSupported = (): boolean => {
  return 'vibrate' in navigator;
}; 