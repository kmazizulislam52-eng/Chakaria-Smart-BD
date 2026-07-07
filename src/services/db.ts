import { Voter, DatabaseStats } from '../types';
import { mockVoters } from '../data/mockVoters';

const DB_NAME = 'ElectionVoterDB_v3';
const DB_VERSION = 1;
const STORE_NAME = 'voters';

export class VoterDatabase {
  private static instance: VoterDatabase;
  private db: IDBDatabase | null = null;

  private constructor() {}

  public static getInstance(): VoterDatabase {
    if (!VoterDatabase.instance) {
      VoterDatabase.instance = new VoterDatabase();
    }
    return VoterDatabase.instance;
  }

  public init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event);
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // Check if database is empty, if so, populate with mock data
        this.getVotersCount().then((count) => {
          if (count === 0) {
            this.importBulk(mockVoters)
              .then(() => {
                console.log('Prepopulated database with mock voters');
                resolve(this.db!);
              })
              .catch(reject);
          } else {
            resolve(this.db!);
          }
        }).catch(() => resolve(this.db!));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('nid', 'nid', { unique: false });
        store.createIndex('voterNo', 'voterNo', { unique: false });
        store.createIndex('nameBn', 'nameBn', { unique: false });
        store.createIndex('nameEn', 'nameEn', { unique: false });
        store.createIndex('centerName', 'centerName', { unique: false });
      };
    });
  }

  private getStore(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    const transaction = this.db.transaction(STORE_NAME, mode);
    return transaction.objectStore(STORE_NAME);
  }

  public getVotersCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readonly');
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public getVoterById(id: string): Promise<Voter | null> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readonly');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public addVoter(voter: Omit<Voter, 'id'>): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const id = 'v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fullVoter: Voter = { ...voter, id, createdAt: Date.now() };
        const store = this.getStore('readwrite');
        const request = store.add(fullVoter);

        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public updateVoter(voter: Voter): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readwrite');
        const request = store.put(voter);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public deleteVoter(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readwrite');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Performs quick matching search across NID, VoterNo, Name (Bangla/English), Center or Area
   */
  public searchVoters(searchQuery: string, maxResults = 100): Promise<Voter[]> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readonly');
        const results: Voter[] = [];
        const cleanQuery = searchQuery.trim().toLowerCase();

        if (!cleanQuery) {
          // If query is empty, return a few default items
          const request = store.openCursor();
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor && results.length < 20) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve(results);
            }
          };
          request.onerror = () => reject(request.error);
          return;
        }

        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            const voter: Voter = cursor.value;
            const nidMatch = voter.nid && voter.nid.includes(cleanQuery);
            const voterNoMatch = voter.voterNo && voter.voterNo.includes(cleanQuery);
            const nameBnMatch = voter.nameBn && voter.nameBn.toLowerCase().includes(cleanQuery);
            const nameEnMatch = voter.nameEn && voter.nameEn.toLowerCase().includes(cleanQuery);
            const areaMatch = voter.area && voter.area.toLowerCase().includes(cleanQuery);
            const centerMatch = voter.centerName && voter.centerName.toLowerCase().includes(cleanQuery);

            if (nidMatch || voterNoMatch || nameBnMatch || nameEnMatch || areaMatch || centerMatch) {
              results.push(voter);
            }

            if (results.length < maxResults) {
              cursor.continue();
            } else {
              resolve(results);
            }
          } else {
            resolve(results);
          }
        };

        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Atomic high-speed transaction to import bulk records (lakhs of voters can be streamed in chunks)
   */
  public importBulk(voters: Voter[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // We start a readwrite transaction
      const transaction = this.db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('Bulk import transaction failed:', event);
        reject(transaction.error || new Error('Transaction aborted'));
      };

      for (const voter of voters) {
        // Ensure every item has a unique id
        const cleanVoter = {
          ...voter,
          id: voter.id || ('v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
          createdAt: voter.createdAt || Date.now()
        };
        store.put(cleanVoter);
      }
    });
  }

  public clearAllVoters(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Truncates database and restores original pre-populated lists
   */
  public resetDatabase(): Promise<void> {
    return this.clearAllVoters().then(() => this.importBulk(mockVoters));
  }

  /**
   * Live statistics aggregates
   */
  public getDatabaseStats(): Promise<DatabaseStats> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readonly');
        let totalVoters = 0;
        let totalMale = 0;
        let totalFemale = 0;
        let totalVoted = 0;
        const centersSet = new Set<string>();
        let constituencyName = 'চকরিয়া পৌরসভা (৭নং ওয়ার্ড), কক্সবাজার-১';

        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            const voter: Voter = cursor.value;
            totalVoters++;
            if (voter.gender === 'Male') totalMale++;
            else if (voter.gender === 'Female') totalFemale++;
            if (voter.isVoted) totalVoted++;
            if (voter.centerName) centersSet.add(voter.centerName);
            if (voter.constituency) constituencyName = voter.constituency;

            cursor.continue();
          } else {
            resolve({
              totalVoters,
              totalMale,
              totalFemale,
              totalCenters: centersSet.size,
              totalVoted,
              constituencyName
            });
          }
        };
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }
}
