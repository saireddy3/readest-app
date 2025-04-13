import { Book, BookConfig, BookNote, BookDataRecord } from '@/types/book';

export type SyncType = 'books' | 'configs' | 'notes';
export type SyncOp = 'push' | 'pull' | 'both';

interface BookRecord extends BookDataRecord, Book {}
interface BookConfigRecord extends BookDataRecord, BookConfig {}
interface BookNoteRecord extends BookDataRecord, BookNote {}

export interface SyncResult {
  books: BookRecord[] | null;
  notes: BookNoteRecord[] | null;
  configs: BookConfigRecord[] | null;
}

export interface SyncData {
  books?: Partial<BookRecord>[];
  notes?: Partial<BookNoteRecord>[];
  configs?: Partial<BookConfigRecord>[];
}

export class SyncClient {
  /**
   * Pull incremental changes since a given timestamp (in ms).
   * Returns empty result as authentication is removed.
   */
  async pullChanges(since: number, type?: SyncType, book?: string): Promise<SyncResult> {
    console.log(`Sync pullChanges skipped (no auth) - since: ${since}, type: ${type}, book: ${book}`);
    // Return empty result
    return {
      books: type === 'books' ? [] : null,
      notes: type === 'notes' ? [] : null,
      configs: type === 'configs' ? [] : null,
    };
  }

  /**
   * Push local changes to the server.
   * No-op as authentication is removed.
   */
  async pushChanges(payload: SyncData): Promise<SyncResult> {
    console.log('Sync pushChanges skipped (no auth) - payload:', payload);
    // Return empty result
    return {
      books: payload.books ? [] : null,
      notes: payload.notes ? [] : null,
      configs: payload.configs ? [] : null,
    };
  }
}
