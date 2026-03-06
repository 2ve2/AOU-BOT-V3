import { db } from "@/db";
import { book } from "@/db/schema/book";
import { cache, CacheKeys, CacheTTL } from "@/lib/cacheService";
import { withTransaction } from "@/lib/transaction";
import type { BookCreateInput } from "@/types/schemas";
import { createId } from "@paralleldrive/cuid2";
import { desc, eq, sql } from "drizzle-orm";

class BookService {
  /**
   * GET ALL BOOKS WITH PAGINATION
   */
  async getAllBooks(option: { limit?: number, offset?: number }) {
    const { limit = 10, offset = 0 } = option;

    return await cache.getOrSet(
      CacheKeys.books(limit, offset),
      async () => {
        try {
          const [books, totalCount] = await Promise.all([
            db
              .select({
                id: book.id,
                courseCode: book.courseCode,
                title: book.title,
                metaData: book.metaData,
                createdAt: book.createdAt,
              })
              .from(book)
              .orderBy(desc(book.createdAt))
              .limit(limit)
              .offset(offset),
            
            db
              .select({ count: sql<number>`count(*)` })
              .from(book)
              .then((result) => Number(result[0]?.count || 0))
          ]);

          return {
            books,
            pagination: {
              total: totalCount,
              limit,
              offset,
              hasMore: offset + limit < totalCount,
            },
          };
        } catch (error) {
          throw error;
        }
      },
      CacheTTL.MEDIUM,
    );
  }

  /**
   * GET A BOOK BY COURSE CODE
   */
  async getBookByCourseCode(courseCode: string) {
    return await cache.getOrSet(
      CacheKeys.bookCode(courseCode),
      async () => {
        try {
          const bookResult = await db
            .select({
              id: book.id,
              courseCode: book.courseCode,
              title: book.title,
              metaData: book.metaData,
              createdAt: book.createdAt,
            })
            .from(book)
            .where(eq(book.courseCode, courseCode))
            .limit(1);

          return bookResult[0] || null
        } catch (error) {
          throw error;
        }
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * UPDATE BOOK
   */
  async updateBook(id?: string, courseCode?: string, data: Partial<BookCreateInput> = {}) {
    try {
      return await withTransaction(async (db) => {
        const updateData: any = {};

        if (data.courseCode !== undefined) {
          updateData.courseCode = data.courseCode.trim();
        }

        if (data.title !== undefined) {
          updateData.title = data.title;
        }

        if (data.metaData !== undefined) {
          updateData.metaData = data.metaData;
        }

        const updatedBook = await db
          .update(book)
          .set(updateData)
          .where(id ? eq(book.id, id!) : eq(book.courseCode, courseCode!))
          .returning();

        cache.delete(id ? CacheKeys.book(id!) : CacheKeys.bookCode(courseCode!));
        cache.deleteByPattern("books:");

        return updatedBook[0] || null;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET A BOOK BY ID
   */
  async getBookById(id: string) {
    return await cache.getOrSet(
      CacheKeys.book(id),
      async () => {
        try {
          const bookResult = await db
            .select({
              id: book.id,
              courseCode: book.courseCode,
              title: book.title,
              metaData: book.metaData,
              createdAt: book.createdAt,
            })
            .from(book)
            .where(eq(book.id, id))
            .limit(1);

          return bookResult[0] || null
        } catch (error) {
          throw error;
        }
      },
      CacheTTL.SHORT,
    );
  }
  
  /**
   * CREATE A NEW BOOK
   */
  async createBook(data: BookCreateInput) {
    try {
      return await withTransaction(async (db) => {
        const newBook = await db
          .insert(book)
          .values({
            id: createId(),
            courseCode: data.courseCode.trim(),
            title: data.title,
            metaData: data.metaData,
            createdAt: new Date(),
          })
          .returning();

        return newBook[0];
      })
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE A BOOK
   */
  async deleteBook(id?: string, courseCode?: string) {
    try {
      return await withTransaction(async (db) => {
        const deleteBook = await db
          .delete(book)
          .where(id ? eq(book.id, id!) : eq(book.courseCode, courseCode!))
          .returning();

        id ? cache.delete(CacheKeys.book(id!)) : cache.delete(CacheKeys.bookCode(courseCode!));

        return deleteBook[0] || null;
      });
    } catch (error) {
      throw error;
    }
  }
}

export const bookService = new BookService();