import { create } from 'zustand';
import { SystemSettings } from '@/types/settings';
import { Book, BookConfig, BookNote } from '@/types/book';
import { EnvConfigType } from '@/services/environment';
import { BookDoc } from '@/libs/document';

interface BookData {
  /* Persistent data shared with different views of the same book */
  id: string;
  book: Book | null;
  file: File | null;
  config: BookConfig | null;
  bookDoc: BookDoc | null;
}

interface BookDataState {
  booksData: { [id: string]: BookData };
  getConfig: (key: string | null) => BookConfig | null;
  setConfig: (key: string, partialConfig: Partial<BookConfig>) => void;
  saveConfig: (
    envConfig: EnvConfigType,
    bookKey: string,
    config: BookConfig,
    settings: SystemSettings,
  ) => void;
  updateBooknotes: (key: string, booknotes: BookNote[]) => BookConfig | undefined;
  getBookData: (keyOrId: string) => BookData | null;
}

export const useBookDataStore = create<BookDataState>((set, get) => ({
  booksData: {},
  getBookData: (keyOrId: string) => {
    const id = keyOrId.split('-')[0]!;
    return get().booksData[id] || null;
  },
  getConfig: (key: string | null) => {
    if (!key) return null;
    const id = key.split('-')[0]!;
    return get().booksData[id]?.config || null;
  },
  setConfig: (key: string, partialConfig: Partial<BookConfig>) => {
    set((state: BookDataState) => {
      const id = key.split('-')[0]!;
      const config = (state.booksData[id]?.config || {}) as BookConfig;
      Object.assign(config, partialConfig);
      return {
        booksData: {
          ...state.booksData,
          [id]: {
            ...state.booksData[id]!,
            config,
          },
        },
      };
    });
  },
  saveConfig: async (
    envConfig: EnvConfigType,
    bookKey: string,
    config: BookConfig,
    settings: SystemSettings,
  ) => {
    console.log(`💾 Saving book config for ${bookKey}`, config);
    const appService = await envConfig.getAppService();
    const id = bookKey.split('-')[0];
    if (!id) {
      console.error(`❌ Invalid book key: ${bookKey}`);
      return;
    }
    
    const bookData = get().booksData[id];
    if (!bookData || !bookData.book) {
      console.error(`❌ Book data not found for ${id}`);
      return;
    }
    
    const book = bookData.book;
    book.progress = config.progress;
    book.updatedAt = Date.now();
    
    config.updatedAt = Date.now();
    
    try {
      // Save config file to storage
      await appService.saveBookConfig(book, config, settings);
      console.log(`✅ Book config saved to storage for ${bookKey}`);
      
      // Save the single book to maintain book data
      const books = await appService.loadLibraryBooks();
      const bookIndex = books.findIndex(b => b.hash === id);
      if (bookIndex >= 0) {
        books[bookIndex] = book;
      } else {
        books.push(book);
      }
      await appService.saveLibraryBooks(books);
      console.log(`✅ Book library updated for ${bookKey}`);
    } catch (error) {
      console.error(`❌ Error saving book config for ${bookKey}:`, error);
    }
  },
  updateBooknotes: (key: string, booknotes: BookNote[]) => {
    let updatedConfig: BookConfig | undefined;
    console.log(`📝 Updating booknotes for ${key}`, booknotes.length, 'items');
    
    set((state) => {
      const id = key.split('-')[0]!;
      const book = state.booksData[id];
      if (!book) {
        console.error(`❌ Book data not found for ${id}`);
        return state;
      }
      
      const dedupedBooknotes = Array.from(
        new Map(booknotes.map((item) => [`${item.id}-${item.type}-${item.cfi}`, item])).values(),
      );
      
      console.log(`📊 Deduped booknotes: ${dedupedBooknotes.length} items`);
      
      updatedConfig = {
        ...book.config,
        updatedAt: Date.now(),
        booknotes: dedupedBooknotes,
      };
      
      console.log(`📦 Storing updated config in memory store`);
      
      return {
        booksData: {
          ...state.booksData,
          [id]: {
            ...book,
            config: {
              ...book.config,
              updatedAt: Date.now(),
              booknotes: dedupedBooknotes,
            },
          },
        },
      };
    });
    
    return updatedConfig;
  },
}));
