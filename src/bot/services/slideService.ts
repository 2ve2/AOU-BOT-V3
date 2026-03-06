import { db } from "@/db";
import { slide } from "@/db/schema/slide";
import { cache, CacheKeys, CacheTTL } from "@/lib/cacheService";
import { withTransaction } from "@/lib/transaction";
import type { SlideCreateInput } from "@/types/schemas";
import { createId } from "@paralleldrive/cuid2";
import { desc, eq, sql } from "drizzle-orm";

class SlideService {
  /**
   * GET ALL SLIDES WITH PAGINATION
   */
  async getAllSlides(option: { limit?: number, offset?: number }) {
    const { limit = 10, offset = 0 } = option;

    return await cache.getOrSet(
      CacheKeys.slides(limit, offset),
      async () => {
        try {
          const [slides, totalCount] = await Promise.all([
            db
              .select({
                id: slide.id,
                courseCode: slide.courseCode,
                title: slide.title,
                metaData: slide.metaData,
                createdAt: slide.createdAt,
              })
              .from(slide)
              .orderBy(desc(slide.createdAt))
              .limit(limit)
              .offset(offset),
            
            db
              .select({ count: sql<number>`count(*)` })
              .from(slide)
              .then((result) => Number(result[0]?.count || 0))
          ]);

          return {
            slides,
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
   * GET A SLIDE BY COURSE CODE
   */
  async getSlideByCourseCode(courseCode: string) {
    return await cache.getOrSet(
      CacheKeys.slideCode(courseCode),
      async () => {
        try {
          const slideResult = await db
            .select({
              id: slide.id,
              courseCode: slide.courseCode,
              title: slide.title,
              metaData: slide.metaData,
              createdAt: slide.createdAt,
            })
            .from(slide)
            .where(eq(slide.courseCode, courseCode))
            .limit(1);

          return slideResult[0] || null
        } catch (error) {
          throw error;
        }
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * GET A SLIDE BY ID
   */
  async getSlideById(id: string) {
    return await cache.getOrSet(
      CacheKeys.slide(id),
      async () => {
        try {
          const slideResult = await db
            .select({
              id: slide.id,
              courseCode: slide.courseCode,
              title: slide.title,
              metaData: slide.metaData,
              createdAt: slide.createdAt,
            })
            .from(slide)
            .where(eq(slide.id, id))
            .limit(1);

          return slideResult[0] || null
        } catch (error) {
          throw error;
        }
      },
      CacheTTL.SHORT,
    );
  }
  
  /**
   * UPDATE SLIDE
   */
  async updateSlide(id?: string, courseCode?: string, data: Partial<SlideCreateInput> = {}) {
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

        const updatedSlide = await db
          .update(slide)
          .set(updateData)
          .where(id ? eq(slide.id, id!) : eq(slide.courseCode, courseCode!))
          .returning();

        cache.delete(id ? CacheKeys.slide(id!) : CacheKeys.slideCode(courseCode!));
        cache.deleteByPattern("slides:");

        return updatedSlide[0] || null;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * CREATE A NEW SLIDE
   */
  async createSlide(data: SlideCreateInput) {
    try {
      return await withTransaction(async (db) => {
        const newSlide = await db
          .insert(slide)
          .values({
            id: createId(),
            courseCode: data.courseCode.trim(),
            title: data.title,
            metaData: data.metaData,
            createdAt: new Date(),
          })
          .returning();

        return newSlide[0];
      })
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE A SLIDE
   */
  async deleteSlide(id?: string, courseCode?: string) {
    try {
      return await withTransaction(async (db) => {
        const deleteSlide = await db
          .delete(slide)
          .where(id ? eq(slide.id, id!) : eq(slide.courseCode, courseCode!))
          .returning();

        id ? cache.delete(CacheKeys.slide(id!)) : cache.delete(CacheKeys.slideCode(courseCode!));

        return deleteSlide[0] || null;
      });
    } catch (error) {
      throw error;
    }
  }
}

export const slideService = new SlideService();