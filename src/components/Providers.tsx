'use client';

import { EnvProvider } from '@/context/EnvContext';
import { SyncProvider } from '@/context/SyncContext';
import { IconContext } from 'react-icons';
import { useDefaultIconSize } from '@/hooks/useResponsiveSize';

const Providers = ({ children }: { children: React.ReactNode }) => {
  const iconSize = useDefaultIconSize();
  return (
    <EnvProvider>
      <IconContext.Provider value={{ size: `${iconSize}px` }}>
        <SyncProvider>{children}</SyncProvider>
      </IconContext.Provider>
    </EnvProvider>
  );
};

export default Providers;
