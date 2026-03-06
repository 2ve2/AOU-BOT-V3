/**
 * Transaction utilities for database operations
 * Provides a consistent way to handle database transactions
 */

import { db } from "@/db";

// Use a more generic database client type that works with both Neon and PostgresJS
export type DatabaseClient = typeof db;

/**
 * Execute a function within a database transaction
 * Automatically handles rollback on errors
 * Falls back to regular db operations if transactions are not supported (e.g., Neon HTTP driver)
 */
export async function withTransaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T> {
	try {
		return await db.transaction(async (tx) => {
			return await fn(tx as unknown as DatabaseClient);
		});
	} catch (error) {
		// Check if the error is about transactions not being supported
		if (error instanceof Error && error.message.includes("No transactions support")) {
			console.warn("Transactions not supported, falling back to regular operations");
			// Fall back to using the regular db instance
			return await fn(db);
		}
		throw error;
	}
}

/**
 * Execute multiple operations in a single transaction
 * Useful for batch operations
 */
export async function batchTransaction<T>(
	operations: Array<(tx: DatabaseClient) => Promise<T>>,
): Promise<T[]> {
	return await withTransaction(async (tx) => {
		const results: T[] = [];
		for (const operation of operations) {
			const result = await operation(tx);
			results.push(result);
		}
		return results;
	});
}

/**
 * Retry a transaction operation with exponential backoff
 * Useful for handling temporary database conflicts
 */
export async function retryTransaction<T>(
	fn: (tx: DatabaseClient) => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 100,
): Promise<T> {
	let lastError: Error = new Error("Transaction failed after multiple attempts");

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await withTransaction(fn);
		} catch (error) {
			lastError = error as Error;

			// Don't retry on the last attempt
			if (attempt === maxRetries) {
				break;
			}

			// Only retry on specific database errors (serialization failures, deadlocks)
			if (error instanceof Error) {
				const shouldRetry =
					error.message.includes("serialization failure") ||
					error.message.includes("deadlock") ||
					error.message.includes("could not serialize");

				if (!shouldRetry) {
					throw error;
				}
			}

			// Exponential backoff with jitter
			const delay = baseDelay * 2 ** attempt + Math.random() * 100;
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Transaction hooks for post-transaction operations
 * Ensures operations run only after successful transaction commit
 */
interface TransactionHook {
	type: "cache-invalidation";
	data: Record<string, unknown>;
	priority: number;
}

// Store hooks to be executed after transaction completion
export const transactionHooks = new Map<string, TransactionHook[]>();

/**
 * Register a hook to be executed after transaction completion
 */
export function registerTransactionHook(
	transactionId: string,
	hook: Omit<TransactionHook, "priority">,
): void {
	if (!transactionHooks.has(transactionId)) {
		transactionHooks.set(transactionId, []);
	}

	transactionHooks.get(transactionId)?.push({
		...hook,
		priority: Date.now(), // Use timestamp as priority
	});
}

/**
 * Generate a unique transaction ID for tracking
 */
export function generateTransactionId(): string {
	return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
