import { db } from "@/db"
import { user } from "@/db/schema/auth"
import { cache, CacheKeys, CacheTTL } from "@/lib/cacheService"
import type { UserUpdateInput } from "@/types/schemas"
import { and, desc, eq, sql } from "drizzle-orm"


export const userService = {
  /**
   * GET USER BY USER ID
   */
  async getUserById(userId: string) {
    return await cache.getOrSet(
      CacheKeys.user(userId),
      async () => {
        const userResult = await db
          .select({
            id: user.id,
            userId: user.userId,
            userName: user.userName,
            fullName: user.fullName,
            isActive: user.isActive,
            lang: user.lang,
            role: user.role,
            createdAt: user.createdAt,
            isBanned: user.isBanned,
            bannedAt: user.bannedAt,
            bannedReason: user.bannedReason,
          })
          .from(user)
          .where(eq(user.userId, userId))

        const userData = userResult[0];
        if (!userData) return null;

        return {...userData};
      },
      CacheTTL.SHORT,
    );
  },

  /**
   * GET USER BY USERNAME
   */
  async getUserByUserName(userName: string) {
    return await cache.getOrSet(
      CacheKeys.user(userName),
      async () => {
        const userResult = await db
          .select({
            id: user.id,
            userId: user.userId,
            userName: user.userName,
            fullName: user.fullName,
            isActive: user.isActive,
            lang: user.lang,
            role: user.role,
            createdAt: user.createdAt,
            isBanned: user.isBanned,
            bannedAt: user.bannedAt,
            bannedReason: user.bannedReason,
          })
          .from(user)
          .where(eq(user.userName, userName))

        return userResult[0]
      },
      CacheTTL.SHORT,
    );
  },

  /**
   * UPDATE USER PROFILE INFORMATION
   */
  async updateUser(userId: string, data: UserUpdateInput) {
    const updateUser: UserUpdateInput = {};

    if (data.lang !== undefined) {
      updateUser.lang = data.lang?.trim();
    }

    if (data.role !== undefined) {
      updateUser.role = data.role;
    }

    const updatedUser = await db
      .update(user)
      .set({
        ...updateUser
      })
      .where(eq(user.userId, userId))
      .returning();

    cache.delete(CacheKeys.user(userId));

    return updatedUser[0];
  },

  /**
   * ADMIN FUNCTION TO BAN A USER
   */
  async banUser(userId: string, reason: string) {
    const bannedUser = await db
      .update(user)
      .set({
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason.trim(),
      })
      .where(eq(user.userId, userId))
      .returning();

    cache.delete(CacheKeys.user(userId));

    return bannedUser[0];
  },
  
  /**
   * ADMIN FUNCTION TO UNBAN A USER
   */
  async unBanUser(userId: string) {
    const unBannedUser = await db
      .update(user)
      .set({
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      })
      .where(eq(user.userId, userId))
      .returning();

    cache.delete(CacheKeys.user(userId));

    return unBannedUser[0];
  },

  /**
   * CHECK IF USER IS BANNED
   */
  async isUserBanned(userId: string): Promise<boolean> {
    const userResult = await db
      .select({
        isBanned: user.isBanned
      })
      .from(user)
      .where(eq(user.userId, userId))
    
    return userResult[0]?.isBanned || false;
  },

  /**
   * ADMIN FUNCTION TO GET USER STATS
   */
  async getUserStats() {
    return await cache.getOrSet(
      CacheKeys.adminUserStats(),
      async () => {
        const statsResult = await db
          .select({
            totalUsers: sql<number>`COUNT(*)::int`,
            inactiveUsers: sql<number>`COUNT(CASE WHEN ${user.isBanned} = true THEN 1 END)::int`,
            bannedUsers: sql<number>`COUNT(CASE WHEN ${user.isActive} = false THEN 1 END)::int`,
            usersToday: sql<number>`COUNT(CASE WHEN DATE(${user.createdAt}) = CURRENT_DATE THEN 1 END)::int`,
            usersThisWeek: sql<number>`COUNT(CASE WHEN ${user.createdAt} >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END)::int`,
            usersThisMonth: sql<number>`COUNT(CASE WHEN ${user.createdAt} >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::int`,
          })
          .from(user)

        const stats = statsResult[0];
        if (!stats) return null

        return {
          // Overview
          totalUsers: stats.totalUsers,
          inactiveUsers: stats.inactiveUsers,
          bannedUsers: stats.bannedUsers,
          
          // New Users
          newUsers: {
            today: stats.usersToday,
            thisWeek: stats.usersThisWeek,
            thisMonth: stats.usersThisMonth,
          },
        };
      },
      CacheTTL.MEDIUM,
    );
  },

  /**
   * GET ALL USERS
   */
  async getAllUsers(
    options: { limit?: number; offset?: number }
  ) {
    const { limit = 20, offset = 0 } = options;


    const [users, totalCount] = await Promise.all([
      db
        .select({
          id: user.id,
          userId: user.userId,
          userName: user.userName,
          fullName: user.fullName,
          isActive: user.isActive,
          lang: user.lang,
          role: user.role,
          createdAt: user.createdAt,
          isBanned: user.isBanned,
          bannedAt: user.bannedAt,
          bannedReason: user.bannedReason,
      })
      .from(user)
      .where(and(eq(user.isBanned, false)))
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset),
    
    db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(and(eq(user.isBanned, false)))
      .then((result) => Number(result[0]?.count || 0))
  ]);

  const transformedUsers = users.map((u) => ({
    ...u
  }));

    return {
      users: transformedUsers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  },
}