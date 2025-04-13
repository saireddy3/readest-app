import { DEFAULT_STORAGE_QUOTA } from '@/services/constants';
import { isWebAppPlatform } from '@/services/environment';

type UserPlan = 'free' | 'plus' | 'pro';

interface Token {
  plan: UserPlan;
  storage_usage_bytes: number;
  [key: string]: string | number;
}

// Return default free plan since authentication is removed
export const getUserPlan = (token: string): UserPlan => {
  return 'free';
};

// Return default storage data since authentication is removed
export const getStoragePlanData = (token: string) => {
  const plan = 'free';
  const usage = 0;
  const fixedQuota = parseInt(process.env['NEXT_PUBLIC_STORAGE_FIXED_QUOTA'] || '0');
  const quota = fixedQuota || DEFAULT_STORAGE_QUOTA[plan] || DEFAULT_STORAGE_QUOTA['free'];

  return {
    plan,
    usage,
    quota,
  };
};

// Always return null since authentication is removed
export const getAccessToken = async (): Promise<string | null> => {
  return null;
};

// Always return null since authentication is removed
export const getUserID = async (): Promise<string | null> => {
  return null;
};

// Always return empty object since authentication is removed
export const validateUserAndToken = async (authHeader: string | undefined) => {
  return {};
};
