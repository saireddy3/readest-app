// Web-based implementation of bridge functions

export interface CopyURIRequest {
  uri: string;
  dst: string;
}

export interface CopyURIResponse {
  success: boolean;
  error?: string;
}

export interface UseBackgroundAudioRequest {
  enabled: boolean;
}

export async function copyURIToPath(request: CopyURIRequest): Promise<CopyURIResponse> {
  console.warn('copyURIToPath is not supported in web environment');
  return {
    success: false,
    error: 'This feature is not available in web browsers',
  };
}

export async function invokeUseBackgroundAudio(request: UseBackgroundAudioRequest): Promise<void> {
  console.warn('useBackgroundAudio is not supported in web environment');
  // In a web environment, we can still attempt to keep audio playing in background
  if (request.enabled) {
    try {
      // This is a no-op in web - browsers handle background audio differently
      console.log('Background audio requested but not fully supported in web');
    } catch (error) {
      console.error('Error with background audio:', error);
    }
  }
}
