import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env['NODE_ENV'] === 'development';
const appPlatform = process.env['NEXT_PUBLIC_APP_PLATFORM'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Next.js uses SSG instead of SSR
  // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: appPlatform === 'static' ? 'export' : (appPlatform === 'web' || isDev ? undefined : 'export'),
  // Note: This feature is required to use the Next.js Image component in SSG mode.
  // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  // Configure assetPrefix or else the server won't properly resolve your assets.
  assetPrefix: '',
  reactStrictMode: true,
  // Treat as single page application
  trailingSlash: false,
  // Add webpack config for module resolution
  webpack: (config, { isServer }) => {
    // Add alias to map foliate-js to @shmandadi/foliate-js
    config.resolve.alias['foliate-js'] = path.join(__dirname, 'node_modules/@shmandadi/foliate-js');
    
    return config;
  },
};

export default nextConfig;
