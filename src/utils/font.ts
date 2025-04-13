import { getOSPlatform } from './misc';

let cachedSysFonts: string[] | null = null;

export const FONT_ENUM_SUPPORTED_OS_PLATFORMS = ['macos', 'windows', 'linux'];

const isSymbolicFontName = (font: string) =>
  /emoji|icons|symbol|dingbats|ornaments|webdings|wingdings/i.test(font);

// Web-based system font detection
// This provides common system fonts - not as accurate as the native implementation
const WEB_SYSTEM_FONTS = [
  // Common sans-serif fonts
  'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Segoe UI',
  'Roboto', 'Open Sans', 'Noto Sans', 'Calibri', 'San Francisco', 'Avenir',
  
  // Common serif fonts
  'Times New Roman', 'Times', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
  'Baskerville', 'Cambria', 'Constantia',
  
  // Common monospace fonts
  'Courier New', 'Courier', 'Monaco', 'Consolas', 'Lucida Console',
  'Menlo', 'Source Code Pro', 'Fira Mono', 'Roboto Mono',
  
  // Additional common fonts
  'Comic Sans MS', 'Impact', 'Century Gothic', 'Futura', 'Optima'
];

export const getSysFontsList = async (): Promise<string[]> => {
  if (cachedSysFonts) {
    return cachedSysFonts;
  }

  try {
    // Try to use the Font API if available
    if ('queryLocalFonts' in window) {
      try {
        // @ts-ignore - Font Access API is not yet in TypeScript
        const availableFonts = await window.queryLocalFonts();
        const fontNames = [...new Set(availableFonts.map((font: any) => font.family))];
        cachedSysFonts = fontNames.filter(font => !isSymbolicFontName(font)).sort();
        return cachedSysFonts;
      } catch (fontAPIError) {
        console.warn('Font Access API failed:', fontAPIError);
        // Fall back to common fonts list
      }
    }
    
    // Fallback to predefined list of common fonts
    cachedSysFonts = WEB_SYSTEM_FONTS.filter(font => !isSymbolicFontName(font)).sort();
    return cachedSysFonts;
  } catch (error) {
    console.error('Error fetching font list:', error);
    return WEB_SYSTEM_FONTS;
  }
};
