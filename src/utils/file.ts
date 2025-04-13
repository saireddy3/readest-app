// Web-based implementation for file handling
import { getOSPlatform } from './misc';

export class DeferredBlob extends Blob {
  promise: Promise<ArrayBuffer>;

  constructor(
    promise: Promise<ArrayBuffer>,
    options?: BlobPropertyBag,
  ) {
    super([], options);
    this.promise = promise;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.promise;
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    const slicePromise = this.promise.then(buffer => {
      const slicedBuffer = buffer.slice(start || 0, end || buffer.byteLength);
      return slicedBuffer;
    });
    return new DeferredBlob(slicePromise, { type: contentType || this.type });
  }
}

export interface ClosableFile {
  open(): Promise<void>;
  close(): Promise<void>;
}

export class NativeFile implements ClosableFile {
  readonly path: string;
  private offset = 0;
  private cachedData: Map<number, ArrayBuffer> = new Map();
  
  static readonly MAX_CACHE_SIZE = 10;
  static readonly CHUNK_SIZE = 1024 * 1024; // 1MB

  constructor(path: string) {
    this.path = path;
  }

  async open(): Promise<void> {
    console.warn('NativeFile.open is not fully supported in web environment');
    // In web environment, we can't directly open files from the file system
    // This is a placeholder for API compatibility
    return Promise.resolve();
  }

  async close(): Promise<void> {
    console.warn('NativeFile.close is not fully supported in web environment');
    // Clear cache when closing
    this.cachedData.clear();
    return Promise.resolve();
  }

  async seek(offset: number): Promise<void> {
    this.offset = offset;
    return Promise.resolve();
  }

  /**
   * Read data from the file
   * In web environment, this is a stub implementation
   * Real files would need to be loaded via file input or drag-and-drop
   */
  async read(len: number): Promise<ArrayBuffer> {
    console.warn('NativeFile.read is not supported in web environment');
    // Return empty buffer in web environment
    return new ArrayBuffer(0);
  }

  /**
   * Returns a blob that can be used to read a segment of the file
   * In web environment, this returns an empty blob
   */
  slice(offset: number, len: number): Blob {
    console.warn('NativeFile.slice is not fully supported in web environment');

    // Create a promise that resolves to an empty buffer
    const promise = Promise.resolve(new ArrayBuffer(0));
    return new DeferredBlob(promise);
  }

  /**
   * Returns a blob for the entire file
   * In web environment, this returns an empty blob
   */
  toBlob(): Blob {
    console.warn('NativeFile.toBlob is not fully supported in web environment');
    
    // Create a promise that resolves to an empty buffer
    const promise = Promise.resolve(new ArrayBuffer(0));
    return new DeferredBlob(promise);
  }
}

/**
 * Create a NativeFile instance
 * In web environment, this is a stub implementation
 */
export function createNativeFile(path: string): NativeFile {
  return new NativeFile(path);
}

/**
 * Web implementation for file reading
 * This can be used with File objects from file inputs
 */
export class WebFile implements ClosableFile {
  private file: File;
  private fileReader: FileReader | null = null;

  constructor(file: File) {
    this.file = file;
  }

  async open(): Promise<void> {
    this.fileReader = new FileReader();
    return Promise.resolve();
  }

  async close(): Promise<void> {
    this.fileReader = null;
    return Promise.resolve();
  }

  async readAsArrayBuffer(): Promise<ArrayBuffer> {
    if (!this.fileReader) {
      throw new Error('File not opened');
    }

    return new Promise<ArrayBuffer>((resolve, reject) => {
      if (!this.fileReader) {
        reject(new Error('File not opened'));
        return;
      }

      this.fileReader.onload = () => {
        if (this.fileReader?.result instanceof ArrayBuffer) {
          resolve(this.fileReader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };

      this.fileReader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      this.fileReader.readAsArrayBuffer(this.file);
    });
  }

  slice(start?: number, end?: number): Blob {
    return this.file.slice(start, end);
  }

  get name(): string {
    return this.file.name;
  }

  get size(): number {
    return this.file.size;
  }
}

export class RemoteFile extends File implements ClosableFile {
  url: string;
  #name: string;
  #lastModified: number;
  #size: number = -1;
  #type: string = '';
  #cache: Map<number, ArrayBuffer> = new Map(); // LRU cache
  #order: number[] = [];

  static MAX_CACHE_CHUNK_SIZE = 1024 * 128;
  static MAX_CACHE_ITEMS_SIZE: number = 10;

  constructor(url: string, name?: string, type = '', lastModified = Date.now()) {
    const basename = url.split('/').pop() || 'remote-file';
    super([], name || basename, { type, lastModified });
    this.url = url;
    this.#name = name || basename;
    this.#type = type;
    this.#lastModified = lastModified;
  }

  override get name() {
    return this.#name;
  }

  override get type() {
    return this.#type;
  }

  override get size() {
    return this.#size;
  }

  override get lastModified() {
    return this.#lastModified;
  }

  async _open_with_head() {
    const response = await fetch(this.url, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error(`Failed to fetch file size: ${response.status}`);
    }
    this.#size = Number(response.headers.get('content-length'));
    this.#type = response.headers.get('content-type') || '';
  }

  async _open_with_range() {
    const response = await fetch(this.url, { headers: { Range: `bytes=${0}-${1023}` } });
    if (!response.ok) {
      throw new Error(`Failed to fetch file size: ${response.status}`);
    }
    this.#size = Number(response.headers.get('content-range')?.split('/')[1]);
    this.#type = response.headers.get('content-type') || '';
  }

  async open(): Promise<void> {
    // FIXME: currently HEAD request in asset protocol is not supported on Android
    if (getOSPlatform() === 'android') {
      await this._open_with_range();
    } else {
      await this._open_with_head();
    }
    return Promise.resolve();
  }

  async close(): Promise<void> {
    this.#cache.clear();
    this.#order = [];
  }

  async fetchRangePart(start: number, end: number) {
    start = Math.max(0, start);
    end = Math.min(this.size - 1, end);
    // console.log(`Fetching range: ${start}-${end}, size: ${end - start + 1}`);
    const response = await fetch(this.url, { headers: { Range: `bytes=${start}-${end}` } });
    if (!response.ok) {
      throw new Error(`Failed to fetch range: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  // inclusive reading of the end: [start, end]
  async fetchRange(start: number, end: number): Promise<ArrayBuffer> {
    const rangeSize = end - start + 1;
    const MAX_RANGE_LEN = 1024 * 1000;

    if (rangeSize > MAX_RANGE_LEN) {
      const buffers: ArrayBuffer[] = [];
      for (let currentStart = start; currentStart <= end; currentStart += MAX_RANGE_LEN) {
        const currentEnd = Math.min(currentStart + MAX_RANGE_LEN - 1, end);
        buffers.push(await this.fetchRangePart(currentStart, currentEnd));
      }
      const totalSize = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
      const combinedBuffer = new Uint8Array(totalSize);
      let offset = 0;
      for (const buffer of buffers) {
        combinedBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      }
      return combinedBuffer.buffer;
    } else if (rangeSize > RemoteFile.MAX_CACHE_CHUNK_SIZE) {
      return this.fetchRangePart(start, end);
    } else {
      let cachedChunkStart = Array.from(this.#cache.keys()).find((chunkStart) => {
        const buffer = this.#cache.get(chunkStart)!;
        const bufferSize = buffer.byteLength;
        return start >= chunkStart && end <= chunkStart + bufferSize;
      });
      if (cachedChunkStart !== undefined) {
        this.#updateAccessOrder(cachedChunkStart);
        const buffer = this.#cache.get(cachedChunkStart)!;
        const offset = start - cachedChunkStart;
        return buffer.slice(offset, offset + rangeSize);
      }
      cachedChunkStart = await this.#fetchAndCacheChunk(start, end);
      const buffer = this.#cache.get(cachedChunkStart)!;
      const offset = start - cachedChunkStart;
      return buffer.slice(offset, offset + rangeSize);
    }
  }

  async #fetchAndCacheChunk(start: number, end: number): Promise<number> {
    const chunkStart = Math.max(0, start - 1024);
    const chunkEnd = Math.max(end, start + RemoteFile.MAX_CACHE_CHUNK_SIZE - 1024 - 1);
    this.#cache.set(chunkStart, await this.fetchRangePart(chunkStart, chunkEnd));
    this.#updateAccessOrder(chunkStart);
    this.#ensureCacheSize();
    return chunkStart;
  }

  #updateAccessOrder(chunkStart: number) {
    const index = this.#order.indexOf(chunkStart);
    if (index > -1) {
      this.#order.splice(index, 1);
    }
    this.#order.unshift(chunkStart);
  }

  #ensureCacheSize() {
    while (this.#cache.size > RemoteFile.MAX_CACHE_ITEMS_SIZE) {
      const oldestKey = this.#order.pop();
      if (oldestKey !== undefined) {
        this.#cache.delete(oldestKey);
      }
    }
  }

  override slice(start = 0, end = this.size, contentType = this.type): Blob {
    // console.log(`Slicing: ${start}-${end}, size: ${end - start}`);
    const dataPromise = this.fetchRange(start, end - 1);

    return new DeferredBlob(dataPromise, { type: contentType });
  }

  override async text() {
    const blob = this.slice(0, this.size);
    return blob.text();
  }

  override async arrayBuffer() {
    const blob = this.slice(0, this.size);
    return blob.arrayBuffer();
  }
}
