import { AppService } from '@/types/system';
import { READEST_WEB_BASE_URL } from './constants';

declare global {
  interface Window {
    __READEST_CLI_ACCESS?: boolean;
    __READEST_UPDATER_ACCESS?: boolean;
  }
}

// Web-only implementation
export const isTauriAppPlatform = () => false;
// Always in web platform mode
export const isWebAppPlatform = () => true;
export const hasUpdater = () => false;
export const hasCli = () => false;
export const isPWA = () => window.matchMedia('(display-mode: standalone)').matches;

// Use the production Web API since we're always in web mode
export const getAPIBaseUrl = () => {
  // Handle environment variables safely in both client and server contexts
  const nodeEnv = typeof process !== 'undefined' && process.env
    ? process.env.NODE_ENV
    : 'production';
  
  const apiBaseUrl = typeof process !== 'undefined' && process.env 
    ? process.env.NEXT_PUBLIC_API_BASE_URL 
    : undefined;
    
  return nodeEnv === 'development'
    ? '/api'
    : `${apiBaseUrl ?? READEST_WEB_BASE_URL}/api`;
};

export interface EnvConfigType {
  getAppService: () => Promise<AppService>;
}

let webAppService: AppService | null = null;
const getWebAppService = async () => {
  if (!webAppService) {
    const { WebAppService } = await import('@/services/webAppService');
    webAppService = new WebAppService();
    await webAppService.loadSettings();
  }
  return webAppService;
};

const environmentConfig: EnvConfigType = {
  getAppService: async () => {
    return getWebAppService();
  },
};

export default environmentConfig;
