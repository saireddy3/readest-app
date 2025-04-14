import * as React from 'react';
import Providers from '@/components/Providers';

import '../styles/globals.css';
import '../styles/fonts.css';

const title = 'Direct Book Reader';
const description = 'A simplified Readest direct reader for viewing EPUB books from URLs without library management.';

export const metadata = {
  title,
  description,
  generator: 'Next.js',
  keywords: ['epub', 'ebook', 'reader', 'readest'],
  authors: [{ name: 'readest', url: 'https://github.com/readest/readest' }],
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: 'white',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
