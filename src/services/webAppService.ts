import { Book } from '@/types/book';
import { FileSystem, BaseDir, AppPlatform } from '@/types/system';
import { getCoverFilename } from '@/utils/book';
import { getOSPlatform, isValidURL } from '@/utils/misc';
import { RemoteFile } from '@/utils/file';

import { isPWA } from './environment';
import { BaseAppService } from './appService';
import { LOCAL_BOOKS_SUBDIR } from './constants';
import { openFileDialog } from '@/utils/webFileSystem';

const resolvePath = (fp: string, base: BaseDir): { baseDir: number; base: BaseDir; fp: string } => {
  switch (base) {
    case 'Books':
      return { baseDir: 0, fp: `${LOCAL_BOOKS_SUBDIR}/${fp}`, base };
    case 'None':
      return { baseDir: 0, fp, base };
    default:
      return { baseDir: 0, fp: `${base}/${fp}`, base };
  }
};

const dbName = 'AppFileSystem';
const dbVersion = 1;

async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    
    try {
      request = indexedDB.open(dbName, dbVersion);
    } catch (error) {
      console.error("Failed to open IndexedDB:", error);
      reject(new Error("Browser storage is unavailable. Your data won't be saved between sessions."));
      return;
    }

    request.onupgradeneeded = (event) => {
      try {
        const db = request.result;
        console.log("Creating or upgrading IndexedDB stores");
        
        // Create our main files store if it doesn't exist
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' });
          console.log("Created 'files' object store");
        }
      } catch (error) {
        console.error("Error during IndexedDB upgrade:", error);
        reject(error);
      }
    };

    request.onsuccess = () => {
      console.log("IndexedDB opened successfully");
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error("Error opening IndexedDB:", request.error);
      reject(request.error || new Error("Failed to open IndexedDB"));
    };
  });
}

const indexedDBFileSystem: FileSystem = {
  getURL(path: string) {
    if (isValidURL(path)) {
      return path;
    } else {
      return URL.createObjectURL(new Blob([path]));
    }
  },
  async getBlobURL(path: string, base: BaseDir) {
    try {
      const content = await this.readFile(path, base, 'binary');
      return URL.createObjectURL(new Blob([content]));
    } catch {
      return path;
    }
  },
  async openFile(path: string, base: BaseDir, filename?: string): Promise<File> {
    try {
      if (isValidURL(path)) {
        // For URLs, create and initialize a RemoteFile
        const remoteFile = new RemoteFile(path, filename);
        
        // Call open() which returns void but initializes the RemoteFile
        await remoteFile.open();
        
        // Return the initialized RemoteFile which extends File
        return remoteFile as File;
      } else {
        // For local files stored in IndexedDB
        const content = await this.readFile(path, base, 'binary');
        return new File([content], filename || path.split('/').pop() || 'file');
      }
    } catch (error) {
      console.error(`Error opening file ${path}:`, error);
      // Return an empty file as a fallback
      return new File([], filename || path.split('/').pop() || 'empty-file');
    }
  },
  async copyFile(srcPath: string, dstPath: string, base: BaseDir) {
    const { fp } = resolvePath(dstPath, base);
    const db = await openIndexedDB();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      const getRequest = store.get(srcPath);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          store.put({ path: fp, content: data.content });
          resolve();
        } else {
          reject(new Error(`File not found: ${srcPath}`));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  },
  async readFile(path: string, base: BaseDir, mode: 'text' | 'binary') {
    const { fp } = resolvePath(path, base);
    console.log(`📖 Reading file from IndexedDB: ${fp}`);
    const db = await openIndexedDB();

    return new Promise<string | ArrayBuffer>((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(fp);

      request.onsuccess = async () => {
        if (request.result) {
          console.log(`✅ Found file in IndexedDB: ${fp}`);
          const content = request.result.content;
          if (mode === 'text') resolve(content);
          else {
            if (content instanceof Blob) {
              const arrayBuffer = await content.arrayBuffer();
              resolve(arrayBuffer);
            } else if (content instanceof ArrayBuffer) {
              resolve(content);
            } else if (typeof content === 'string') {
              resolve(new TextEncoder().encode(content).buffer as ArrayBuffer);
            } else {
              console.error(`❌ Unsupported content type in IndexedDB for ${fp}:`, typeof content);
              reject(new Error('Unsupported content type in IndexedDB'));
            }
          }
        } else {
          console.error(`❌ File not found in IndexedDB: ${fp}`);
          reject(new Error(`File not found: ${fp}`));
        }
      };

      request.onerror = () => {
        console.error(`❌ Error reading file from IndexedDB: ${fp}`, request.error);
        reject(request.error);
      };
    });
  },
  async writeFile(path: string, base: BaseDir, content: string | ArrayBuffer) {
    const { fp } = resolvePath(path, base);
    console.log(`📝 Writing file to IndexedDB: ${fp}`);
    const db = await openIndexedDB();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');

      const putRequest = store.put({ path: fp, content });

      putRequest.onsuccess = () => {
        console.log(`✅ Successfully wrote file to IndexedDB: ${fp}`);
        resolve();
      };

      putRequest.onerror = () => {
        console.error(`❌ Error writing file to IndexedDB: ${fp}`, putRequest.error);
        reject(putRequest.error);
      };

      transaction.oncomplete = () => {
        console.log(`✅ Transaction completed for writing file: ${fp}`);
        resolve();
      };
      
      transaction.onerror = () => {
        console.error(`❌ Transaction error for writing file: ${fp}`, transaction.error);
        reject(transaction.error);
      };
    });
  },
  async removeFile(path: string, base: BaseDir) {
    const { fp } = resolvePath(path, base);
    const db = await openIndexedDB();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');

      store.delete(fp);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  async createDir() {
    // Directories are virtual in IndexedDB; no-op
  },
  async removeDir() {
    // Directories are virtual in IndexedDB; no-op
  },
  async readDir(path: string) {
    const db = await openIndexedDB();
    return new Promise<{ path: string; isDir: boolean }[]>((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result as { path: string }[];
        resolve(
          files
            .filter((file) => file.path.startsWith(path))
            .map((file) => ({ path: file.path, isDir: false })),
        );
      };

      request.onerror = () => reject(request.error);
    });
  },
  async exists(path: string, base: BaseDir) {
    const { fp } = resolvePath(path, base);
    console.log(`🔍 Checking if file exists in IndexedDB: ${fp}`);
    const db = await openIndexedDB();

    return new Promise<boolean>((resolve, reject) => {
      const transaction = db.transaction('files', 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(fp);

      request.onsuccess = () => {
        const exists = !!request.result;
        console.log(`${exists ? '✅' : '❌'} File existence check in IndexedDB: ${fp} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
        resolve(exists);
      };
      
      request.onerror = () => {
        console.error(`❌ Error checking file existence in IndexedDB: ${fp}`, request.error);
        reject(request.error);
      };
    });
  },
  getPrefix() {
    return null;
  },
};

export class WebAppService extends BaseAppService {
  fs = indexedDBFileSystem;
  appPlatform = 'web' as AppPlatform;
  isAppDataSandbox = false;
  isMobile = ['android', 'ios'].includes(getOSPlatform());
  isAndroidApp = false;
  isIOSApp = false;
  hasTrafficLight = false;
  hasWindow = true;
  hasWindowBar = false;
  hasContextMenu = false;
  hasRoundedWindow = false;
  hasSafeAreaInset = isPWA();
  hasHaptics = false;
  hasSysFontsList = false;

  override resolvePath(fp: string, base: BaseDir): { baseDir: number; base: BaseDir; fp: string } {
    return resolvePath(fp, base);
  }

  async getInitBooksDir(): Promise<string> {
    return LOCAL_BOOKS_SUBDIR;
  }

  async getCacheDir(): Promise<string> {
    return 'Cache';
  }

  async selectDirectory(): Promise<string> {
    try {
      const result = await openFileDialog({ directory: true });
      if (result && result.length > 0 && result[0]) {
        return result[0];
      }
      throw new Error('No directory selected');
    } catch (error) {
      console.error('Error selecting directory:', error);
      throw new Error('Directory selection is not fully supported in browser');
    }
  }

  async selectFiles(name: string, extensions: string[]): Promise<string[]> {
    try {
      const result = await openFileDialog({
        multiple: true,
        filters: [{ name, extensions }]
      });
      
      if (result && result.length > 0) {
        return result.map(file => typeof file === 'string' ? file : URL.createObjectURL(file));
      }
      return [];
    } catch (error) {
      console.error('Error selecting files:', error);
      throw new Error('File selection failed');
    }
  }

  getCoverImageUrl = (book: Book): string => {
    return this.fs.getURL(`${LOCAL_BOOKS_SUBDIR}/${getCoverFilename(book)}`);
  };

  getCoverImageBlobUrl = async (book: Book): Promise<string> => {
    return this.fs.getBlobURL(`${LOCAL_BOOKS_SUBDIR}/${getCoverFilename(book)}`, 'None');
  };
}
