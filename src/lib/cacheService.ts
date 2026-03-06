/**
 * Simple in-memory cache implementation
 * In production, consider using Redis or similar distributed cache
 */

interface CacheItem<T> {
	value: T;
	expiresAt: number;
	createdAt: number;
}

interface CacheStats {
	hits: number;
	misses: number;
	sets: number;
	deletes: number;
	size: number;
}

class Cache {
	private cache = new Map<string, CacheItem<unknown>>();
	private stats: CacheStats = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
		size: 0,
	};
	private cleanupInterval: NodeJS.Timeout;

	constructor(
		private maxSize: number = 1000,
		cleanupIntervalMs: number = 60000,
	) {
		// Clean up expired items every minute
		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, cleanupIntervalMs);
	}

	/**
	 * Get a value from cache
	 */
	get<T>(key: string): T | undefined {
		const item = this.cache.get(key);

		if (!item) {
			this.stats.misses++;
			return undefined;
		}

		// Check if expired
		if (Date.now() > item.expiresAt) {
			this.cache.delete(key);
			this.stats.misses++;
			this.stats.deletes++;
			return undefined;
		}

		this.stats.hits++;
		return item.value as T;
	}

	/**
	 * Set a value in cache
	 */
	set<T>(key: string, value: T, ttlMs: number = 300000): void {
		// Default 5 minutes
		// Remove oldest items if cache is full
		if (this.cache.size >= this.maxSize) {
			this.evictOldest();
		}

		const now = Date.now();
		this.cache.set(key, {
			value,
			expiresAt: now + ttlMs,
			createdAt: now,
		});

		this.stats.sets++;
		this.stats.size = this.cache.size;
	}

	/**
	 * Delete a value from cache
	 */
	delete(key: string): boolean {
		const deleted = this.cache.delete(key);
		if (deleted) {
			this.stats.deletes++;
			this.stats.size = this.cache.size;
		}
		return deleted;
	}

	/**
	 * Check if key exists and is not expired
	 */
	has(key: string): boolean {
		const item = this.cache.get(key);
		if (!item) return false;

		if (Date.now() > item.expiresAt) {
			this.cache.delete(key);
			return false;
		}

		return true;
	}

	/**
	 * Clear all cache entries
	 */
	clear(): void {
		this.cache.clear();
		this.stats.size = 0;
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		return { ...this.stats };
	}

	/**
	 * Get cache hit rate
	 */
	getHitRate(): number {
		const total = this.stats.hits + this.stats.misses;
		return total === 0 ? 0 : this.stats.hits / total;
	}

	/**
	 * Clean up expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		let deletedCount = 0;

		for (const [key, item] of this.cache.entries()) {
			if (now > item.expiresAt) {
				this.cache.delete(key);
				deletedCount++;
			}
		}

		if (deletedCount > 0) {
			this.stats.deletes += deletedCount;
			this.stats.size = this.cache.size;
			console.log(`Cache cleanup: removed ${deletedCount} expired entries`);
		}
	}

	/**
	 * Evict oldest entries when cache is full
	 */
	private evictOldest(): void {
		let oldestKey: string | undefined;
		let oldestTime = Infinity;

		for (const [key, item] of this.cache.entries()) {
			if (item.createdAt < oldestTime) {
				oldestTime = item.createdAt;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey);
			this.stats.deletes++;
		}
	}

	/**
	 * Get or set pattern - fetch from cache or compute and cache
	 */
	async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 300000): Promise<T> {
		const cached = this.get<T>(key);
		if (cached !== undefined) {
			return cached;
		}

		const value = await fetcher();
		this.set(key, value, ttlMs);
		return value;
	}

	/**
	 * Delete multiple keys by pattern (prefix matching)
	 */
	deleteByPattern(pattern: string): number {
		let deletedCount = 0;
		for (const key of this.cache.keys()) {
			if (key.startsWith(pattern)) {
				this.cache.delete(key);
				deletedCount++;
			}
		}

		if (deletedCount > 0) {
			this.stats.deletes += deletedCount;
			this.stats.size = this.cache.size;
		}

		return deletedCount;
	}

	/**
	 * Get cache size in bytes (approximate)
	 */
	getSizeInBytes(): number {
		let totalSize = 0;
		for (const [key, item] of this.cache.entries()) {
			// Rough estimation: key + JSON stringified value
			totalSize += key.length * 2; // UTF-16 characters
			totalSize += JSON.stringify(item.value).length * 2;
			totalSize += 32; // Overhead for timestamps and object structure
		}
		return totalSize;
	}

	/**
	 * Destroy cache and cleanup
	 */
	destroy(): void {
		clearInterval(this.cleanupInterval);
		this.clear();
	}
}

export const cache = new Cache(1500, 300000);

// Cache key generators with improved organization
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,

  // User Commands
  userCommand: (userId: string) => `user:command:${userId}`,

  // Admin Caches
  adminUserStats: () => "admin:user:stats",
  adminUser: (userId: string) => `admin:user:${userId}`,
  adminSystemStats: () => "admin:system:stats",
  adminBooksStats: () => "admin:books:stats",
  adminSlidesStats: () => "admin:slides:stats",
  adminCalendarStats: () => "admin:calendar:stats",
  adminCourseStats: () => "admin:course:stats",
  adminGroupStats: () => "admin:group:stats",
  adminFAQStats: () => "admin:faq:stats",
  adminAllStats: () => "admin:all:stats",

  // Book Caches
  book: (id: string) => `book:${id}`,
	books: (limit: number, offset: number) => `books:${limit}:${offset}`,
  bookCode: (courseCode: string) => `book:code:${courseCode}`,

  // Slide Caches
  slide: (id: string) => `slide:${id}`,
  slides: (limit: number, offset: number) => `slides:${limit}:${offset}`,
  slideCode: (courseCode: string) => `slide:code:${courseCode}`,
} as const;

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 5 * 60, // 5 minutes
  LONG: 30 * 60, // 30 minutes
  VERY_LONG: 2 * 60 * 60, // 2 hours
} as const;

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("Destroying cache...");
	cache.destroy();
});

process.on("SIGINT", () => {
	console.log("Destroying cache...");
	cache.destroy();
});