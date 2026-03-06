import { z } from "zod";

export const UserCreateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  userId: z.string().min(1, "User ID is required"),
  userName: z.string(),
  fullName: z.string().nullable().optional(),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;


export const UserUpdateSchema = z.object({
  lang: z.string().optional(),
  role: z.enum(["user", "admin", "owner"]).optional(),
});

export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;


export const FAQSchema = z.object({
  id: z.number(),
  question: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  answer: z.object({
    ar: z.string(),
    en: z.string(),
  }),
});

export type FAQ = z.infer<typeof FAQSchema>;

export const FAQCreateSchema = z.object({
  question: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  answer: z.object({
    ar: z.string(),
    en: z.string(),
  }),
});

export type FAQCreateInput = z.infer<typeof FAQCreateSchema>;


export const AcademicCalendarSchema = z.object({
  id: z.number(),
  title: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  answer: z.object({
    ar: z.string(),
    en: z.string(),
  }),
});

export type AcademicCalendar = z.infer<typeof AcademicCalendarSchema>;

export const AcademicCalendarCreateSchema = z.object({
  title: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  answer: z.object({
    ar: z.string(),
    en: z.string(),
  }),
});

export type AcademicCalendarCreateInput = z.infer<typeof AcademicCalendarCreateSchema>;


export const GroupSchema = z.object({
  id: z.number(),
  courseCode: z.string(),
  main: z.object({
    ar: z.string(),
    en: z.string(),
    link: z.string(),
  }),
  section: z.object({
    ar: z.string(),
    en: z.string(),
    link: z.string(),
  }),
});

export type Group = z.infer<typeof GroupSchema>;

export const GroupCreateSchema = z.object({
  courseCode: z.string(),
  main: z.object({
    ar: z.string(),
    en: z.string(),
    link: z.string(),
  }),
  section: z.object({
    ar: z.string(),
    en: z.string(),
    link: z.string(),
  }),
});

export type GroupCreateInput = z.infer<typeof GroupCreateSchema>;


export const CourseSchema = z.object({
  id: z.number(),
  title: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  link: z.string(),
});

export type Course = z.infer<typeof CourseSchema>;

export const CourseCreateSchema = z.object({
  title: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  link: z.string(),
});

export type CourseCreateInput = z.infer<typeof CourseCreateSchema>;

export const BookCreateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  courseCode: z.string().min(1, "Course code is required"),
  title: z.object({
    ar: z.string().min(1, "Arabic title is required"),
    en: z.string().min(1, "English title is required"),
  }),
  metaData: z.array(z.string()).optional(),
});

export type BookCreateInput = z.infer<typeof BookCreateSchema>;

export const BookSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  title: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  metaData: z.array(z.string()),
});

export type Book = z.infer<typeof BookSchema>;

export const BookPaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

export type BookPagination = z.infer<typeof BookPaginationSchema>;

export const BookQuerySchema = z.object({
  books: z.array(BookSchema),
  pagination: BookPaginationSchema,
});

export type BookQuery = z.infer<typeof BookQuerySchema>;

export const SlideCreateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  courseCode: z.string().min(1, "Course code is required"),
  title: z.object({
    ar: z.string().min(1, "Arabic title is required"),
    en: z.string().min(1, "English title is required"),
  }),
  metaData: z.array(z.string()).optional(),
});

export type SlideCreateInput = z.infer<typeof SlideCreateSchema>;

export const SlideSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  title: z.object({
    ar: z.string(),
    en: z.string(),
  }),
  metaData: z.array(z.string()),
  createdAt: z.date(),
});

export type Slide = z.infer<typeof SlideSchema>;

export const SlidePaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

export type SlidePagination = z.infer<typeof SlidePaginationSchema>;

export const SlideQuerySchema = z.object({
  slides: z.array(SlideSchema),
  pagination: SlidePaginationSchema,
});

export type SlideQuery = z.infer<typeof SlideQuerySchema>;