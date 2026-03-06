import { MiftahDB } from 'miftahdb/bun';

// Initialize miftahdb with a database file
const db = new MiftahDB('./data/miftahdb.db');

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const miftahdb = {
  /**
   * Set a value in the database with optional TTL (in seconds)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    const expiresAt = ttlSeconds 
      ? Date.now() + ttlSeconds * 1000 
      : Number.MAX_SAFE_INTEGER;
    
    const result = db.set(key, { value, expiresAt });
    return result.success;
  },

  /**
   * Get a value from the database
   * Returns null if key doesn't exist or has expired
   */
  get<T>(key: string): T | null {
    const result = db.get<CacheEntry<T>>(key);
    
    if (!result.success) return null;
    
    const entry = result.data;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      db.delete(key);
      return null;
    }
    
    return entry.value;
  },

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const result = db.get<CacheEntry<any>>(key);
    
    if (!result.success) return false;
    
    const entry = result.data;
    
    if (Date.now() > entry.expiresAt) {
      db.delete(key);
      return false;
    }
    
    return true;
  },

  /**
   * Delete a specific key from the database
   */
  delete(key: string): boolean {
    const result = db.delete(key);
    return result.success;
  },

  /**
   * Clear all entries from the database
   * Note: miftahdb doesn't have a built-in clear method
   */
  clear(): boolean {
    // miftahdb doesn't have a clear method
    // For production use, consider deleting the database file and reinitializing
    try {
      // This is a placeholder - actual implementation would require
      // either deleting the db file or iterating through all keys
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get or set pattern - returns cached value if exists, otherwise sets and returns new value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;
    
    const value = await factory();
    this.set(key, value, ttlSeconds);
    return value;
  },

  /**
   * Close the database connection
   */
  close(): void {
    // miftahdb doesn't have an explicit close method
    // The database connection is automatically managed
  }
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 5 * 60, // 5 minutes
  LONG: 30 * 60, // 30 minutes
  VERY_LONG: 2 * 60 * 60, // 2 hours
} as const;

// Cache key generators
export const CacheKeys = {
  // user: (userId: string) => `user:${userId}`,
  userCommand: (userId: string) => `user:command:${userId}`,
  userPlan: (userId: string) => `user:${userId}:selected_plan`,
  userEmail: (userId: string) => `user:${userId}:selected_branch`,

  // adminFaq: (userId: string) => `admin:${userId}`
} as const;
