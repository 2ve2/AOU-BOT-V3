import { cache, CacheKeys, CacheTTL } from "@/lib/cacheService";
import { db } from "@/db";
import { book } from "@/db/schema/book";
import { slide } from "@/db/schema/slide";
import { sql } from "drizzle-orm";
import { calendarService } from "./calendarService";
import { courseService } from "./courseService";
import { groupService } from "./groupService";
import { faqService } from "./faqService";


class StatisticsService {
  /**
   * GET BOOKS statistics
   */
  async getBooksStats() {
    return await cache.getOrSet(
      CacheKeys.adminBooksStats(),
      async () => {
        const [totalBooks, totalFiles] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(book)
            .then((result) => Number(result[0]?.count || 0)),
          
          db
            .select({
              totalFiles: sql<number>`sum(json_array_length(${book.metaData}))`
            })
            .from(book)
            .then((result) => Number(result[0]?.totalFiles || 0))
        ]);

        return {
          totalBooks,
          totalFiles,
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * GET SLIDES statistics
   */
  async getSlidesStats() {
    return await cache.getOrSet(
      CacheKeys.adminSlidesStats(),
      async () => {
        const [totalSlides, totalFiles] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(slide)
            .then((result) => Number(result[0]?.count || 0)),
          
          db
            .select({
              totalFiles: sql<number>`sum(json_array_length(${slide.metaData}))`
            })
            .from(slide)
            .then((result) => Number(result[0]?.totalFiles || 0))
        ]);

        return {
          totalSlides,
          totalFiles,
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * GET CALENDAR statistics
   */
  async getCalendarStats() {
    return await cache.getOrSet(
      CacheKeys.adminCalendarStats(),
      async () => {
        const calendars = await calendarService.getAllCalendars();
        return {
          totalCalendars: calendars.length,
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * GET COURSE statistics
   */
  async getCourseStats() {
    return await cache.getOrSet(
      CacheKeys.adminCourseStats(),
      async () => {
        const courses = await courseService.getAllCourses();
        return {
          totalCourses: courses.length,
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * GET GROUP statistics
   */
  async getGroupStats() {
    return await cache.getOrSet(
      CacheKeys.adminGroupStats(),
      async () => {
        const groups = await groupService.getAllGroups();
        return {
          totalGroups: groups.length,
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * GET FAQ statistics
   */
  async getFAQStats() {
    return await cache.getOrSet(
      CacheKeys.adminFAQStats(),
      async () => {
        const faqs = await faqService.getAllFAQs();
        return {
          totalFAQs: faqs.length,
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT,
    );
  }

  /**
   * GET ALL statistics
   */
  async getAllStats() {
    return await cache.getOrSet(
      CacheKeys.adminAllStats(),
      async () => {
        const [booksStats, slidesStats, calendarStats, courseStats, groupStats, faqStats] = await Promise.all([
          this.getBooksStats(),
          this.getSlidesStats(),
          this.getCalendarStats(),
          this.getCourseStats(),
          this.getGroupStats(),
          this.getFAQStats(),
        ]);

        return {
          books: booksStats,
          slides: slidesStats,
          calendars: calendarStats,
          courses: courseStats,
          groups: groupStats,
          faqs: faqStats,
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT,
    );
  }

  /**
 * Get system statistics
 */
  async getSystemStats() {
    return await cache.getOrSet(
      CacheKeys.adminSystemStats(),
      async () => {
        const [cacheStats] = await Promise.all([
          cache.getStats(),
        ]);

        return {
          cache: {
            ...cacheStats,
            hitRate: cache.getHitRate(),
          },
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        };
      },
      CacheTTL.SHORT, // Cache for 1 minute
    );
  }
}

export const statisticsService = new StatisticsService();