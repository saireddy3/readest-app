'use client';

import { Suspense, useEffect, useState } from 'react';
import Reader from './reader/components/Reader';
import Spinner from '@/components/Spinner';
import { EnvProvider } from '@/context/EnvContext';
import { SyncProvider } from '@/context/SyncContext';
import { Toast } from '@/components/Toast';

const HomePage = () => {
  const [dbError, setDbError] = useState<string | null>(null);

  // Check for IndexedDB support
  useEffect(() => {
    // Test if IndexedDB is available and working
    const testDbAccess = () => {
      try {
        const request = indexedDB.open('readest-test-db');
        
        request.onerror = (event) => {
          console.error("IndexedDB error:", event);
          setDbError("Your browser's storage (IndexedDB) is disabled or not working. Your highlights and bookmarks won't be saved between sessions.");
        };
        
        request.onsuccess = (event) => {
          const db = request.result;
          db.close();
          // Delete the test database
          indexedDB.deleteDatabase('readest-test-db');
        };
      } catch (error) {
        console.error("IndexedDB access test failed:", error);
        setDbError("Your browser's storage (IndexedDB) is disabled or not available. Your highlights and bookmarks won't be saved between sessions.");
      }
    };
    
    testDbAccess();
  }, []);

  return (
    <EnvProvider>
      <SyncProvider>
        {dbError && (
          <div className="alert alert-warning fixed bottom-4 left-4 right-4 z-50 shadow-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{dbError}</span>
            </div>
          </div>
        )}
        <Suspense fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <Spinner loading={true} />
          </div>
        }>
          <Reader />
          <Toast />
        </Suspense>
      </SyncProvider>
    </EnvProvider>
  );
};

export default HomePage;
