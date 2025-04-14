'use client';

import clsx from 'clsx';
import * as React from 'react';
import { useEffect, Suspense, useRef, useState } from 'react';
import { md5 } from 'js-md5';

import { useEnv } from '@/context/EnvContext';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { Toast } from '@/components/Toast';
import ReaderContent from './ReaderContent';
import { useSidebarStore } from '@/store/sidebarStore';
import Spinner from '@/components/Spinner';
import { Book } from '@/types/book';

// Static book URL - you can change this to any supported book URL
const BOOK_URL = 'https://cdn.readest.com/books/the-scarlet-letter.epub';

const Reader: React.FC = () => {
  const { envConfig, appService } = useEnv();
  const { settings, setSettings } = useSettingsStore();
  const { isSideBarVisible } = useSidebarStore();
  const isInitiating = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookHash, setBookHash] = useState<string | null>(null);

  const { updateAppTheme } = useThemeStore();
  useTheme();
  useScreenWakeLock(settings.screenWakeLock);

  useEffect(() => {
    updateAppTheme('base-100');
    if (isInitiating.current) return;
    isInitiating.current = true;
    
    const initSettings = async () => {
      try {
        console.log("⏳ Starting book initialization process");
        const appService = await envConfig.getAppService();
        
        // Load and set user settings first
        console.log("⏳ Loading user settings");
        const settings = await appService.loadSettings();
        setSettings(settings);
        
        console.log("⏳ Fetching book from URL:", BOOK_URL);
        // Fetch the file from URL
        const response = await fetch(BOOK_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch book: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log("✅ Successfully fetched book content:", blob.size, "bytes");
        
        // Create a File object from the blob
        const filename = BOOK_URL.split('/').pop() || 'book.epub';
        const file = new File([blob], filename, { type: 'application/epub+zip' });
        
        // Generate a hash for the book
        const arrayBuffer = await file.arrayBuffer();
        const hash = md5(arrayBuffer);
        console.log("📊 Book hash:", hash);
        
        // We need to ensure the library exists in IndexedDB
        let books = await appService.loadLibraryBooks();
        console.log("📚 Current library has", books.length, "books");
        
        // Check if book exists by hash
        const existingBook = books.find(b => b.hash === hash);
        if (existingBook) {
          console.log("📕 Book already exists in library:", existingBook);
          setBookHash(existingBook.hash);
        } else {
          console.log("📗 Importing new book");
          
          // Import the book using the File object
          const book = await appService.importBook(
            file,
            books,
            true,  // Save the book file locally
            true,  // Save the cover as well
            false,  // don't overwrite
            false   // not transient
          );
          
          if (book) {
            // Ensure the book has the source URL saved
            book.url = BOOK_URL;
            
            console.log("✅ Book successfully imported:", book);
            
            // Update books array with the new book
            books = [book, ...books.filter(b => b.hash !== book.hash)];
            
            // Save the updated library to IndexedDB
            console.log("💾 Saving updated library to storage");
            await appService.saveLibraryBooks(books);
            
            // Set the book hash for rendering
            setBookHash(book.hash);
          } else {
            throw new Error("Book import returned null");
          }
        }
        
        // Force a save of the current settings to ensure defaults are stored
        await appService.saveSettings(settings);
        
        console.log("✅ Book initialization complete");
      } catch (err) {
        console.error("❌ Error loading book:", err);
        setError(`Error loading book: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
        isInitiating.current = false;
      }
    };

    initSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="hero h-dvh bg-base-100">
        <div className="hero-content text-center">
          <div>
            <Spinner loading={true} />
            <div className="mt-4 text-base-content">Loading book from URL...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hero h-dvh bg-base-100">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-error">Error</h1>
            <p className="py-4 text-base-content">{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    settings?.globalReadSettings && (
      <div
        className={clsx(
          `reader-page bg-base-100 text-base-content select-none`,
          !isSideBarVisible && appService?.hasRoundedWindow && 'rounded-window',
        )}
      >
        <Suspense>
          <ReaderContent key={bookHash || 'default'} ids={bookHash || undefined} settings={settings} />
          <Toast />
        </Suspense>
      </div>
    )
  );
};

export default Reader;
