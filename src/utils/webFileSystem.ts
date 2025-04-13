// Web-based file system functions using the File System Access API where available

/**
 * Convert a file path to a usable URL
 */
export const convertFileSrc = (filePath: string): string => {
  if (filePath.startsWith('blob:') || filePath.startsWith('data:') || filePath.startsWith('http')) {
    return filePath;
  }
  
  // For web, we can't directly access the file system paths
  // Return a placeholder or error indicator
  console.warn('Direct file path access is not supported in web environments');
  return filePath;
};

/**
 * Open a file dialog for selecting files
 */
export const openFileDialog = async (options: {
  multiple?: boolean;
  directory?: boolean;
  filters?: Array<{ name: string; extensions: string[] }>;
}): Promise<string[] | null> => {
  try {
    // Check if File System Access API is available
    if ('showOpenFilePicker' in window) {
      const pickerOpts: any = {
        multiple: options.multiple || false,
      };
      
      if (options.filters && options.filters.length > 0) {
        pickerOpts.types = options.filters.map(filter => ({
          description: filter.name,
          accept: {
            'application/octet-stream': filter.extensions.map(ext => `.${ext}`)
          }
        }));
      }
      
      if (options.directory) {
        // @ts-ignore - TypeScript doesn't know about this API yet
        const dirHandle = await window.showDirectoryPicker();
        return [dirHandle.name]; // Return directory name as a fallback
      } else {
        // @ts-ignore - TypeScript doesn't know about this API yet
        const fileHandles = await window.showOpenFilePicker(pickerOpts);
        const files = await Promise.all(fileHandles.map(async (handle: any) => {
          const file = await handle.getFile();
          return URL.createObjectURL(file);
        }));
        return files;
      }
    } else {
      // Fallback for browsers without File System Access API
      console.warn('File System Access API not available');
      const input = document.createElement('input');
      input.type = 'file';
      
      if (options.multiple) {
        input.multiple = true;
      }
      
      if (options.filters && options.filters.length > 0) {
        input.accept = options.filters
          .flatMap(filter => filter.extensions.map(ext => `.${ext}`))
          .join(',');
      }
      
      return new Promise<string[] | null>((resolve) => {
        input.onchange = () => {
          if (!input.files || input.files.length === 0) {
            resolve(null);
            return;
          }
          
          const files = Array.from(input.files).map(file => URL.createObjectURL(file));
          resolve(files);
        };
        
        input.click();
      });
    }
  } catch (error) {
    console.error('Error opening file dialog:', error);
    return null;
  }
};

/**
 * Get app data directory (no direct web equivalent)
 */
export const getAppDataDir = async (): Promise<string> => {
  // Web apps don't have direct access to system directories
  // Return a placeholder value
  return '/app-data';
};

/**
 * Get app cache directory (no direct web equivalent)
 */
export const getAppCacheDir = async (): Promise<string> => {
  // Web apps don't have direct access to system directories
  // Return a placeholder value
  return '/app-cache';
};

/**
 * Read a file (using fetch for web)
 */
export const readFile = async (
  path: string, 
  mode: 'text' | 'binary' = 'text'
): Promise<string | ArrayBuffer | null> => {
  try {
    // Handle blob URLs and relative paths
    const response = await fetch(path);
    
    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }
    
    return mode === 'text' ? await response.text() : await response.arrayBuffer();
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
};

/**
 * Check if a file exists (limited web support)
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}; 