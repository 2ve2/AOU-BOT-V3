import { promises as fs } from 'fs';
import * as path from 'path';
import type { CourseCreateInput, Course } from '@/types/schemas';

const COURSES_FILE_PATH = path.join(process.cwd(), 'src/data/courses.json');

interface CoursesData {
  courses: Course[];
}

/**
 * Read Courses from JSON file
 */
async function readCoursesFile(): Promise<CoursesData> {
  try {
    const data = await fs.readFile(COURSES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { courses: [] };
  }
}

/**
 * Write Courses to JSON file
 */
async function writeCoursesFile(data: CoursesData): Promise<void> {
  await fs.writeFile(COURSES_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export const courseService = {
  /**
   * CREATE A NEW COURSE
   */
  async createCourse(data: CourseCreateInput): Promise<Course> {
    const coursesData = await readCoursesFile();
    
    const newCourse: Course = {
      id: Date.now(), // Generate unique ID based on timestamp
      title: data.title,
      link: data.link,
    };
    
    coursesData.courses.push(newCourse);
    await writeCoursesFile(coursesData);
    
    return newCourse;
  },

  /**
   * GET ALL COURSES
   */
  async getAllCourses(): Promise<Course[]> {
    const coursesData = await readCoursesFile();
    return coursesData.courses;
  },

  /**
   * DELETE COURSE BY ID
   */
  async deleteCourse(id: number): Promise<boolean> {
    const coursesData = await readCoursesFile();
    
    const initialLength = coursesData.courses.length;
    coursesData.courses = coursesData.courses.filter(course => course.id !== id);
    
    if (coursesData.courses.length === initialLength) {
      return false; // Course not found
    }
    
    await writeCoursesFile(coursesData);
    return true;
  },

  /**
   * GET COURSE BY ID
   */
  async getCourseById(id: number): Promise<Course | undefined> {
    const coursesData = await readCoursesFile();
    return coursesData.courses.find(course => course.id === id);
  },

  /**
   * GET COURSE BY TITLE
   */
  async getCourseByTitle(title: string, lang: "ar" | "en"): Promise<Course | undefined> {
    const coursesData = await readCoursesFile();
    return coursesData.courses.find(course => course.title[lang] === title);
  },

  /**
   * GET ALL COURSE TITLES
   */
  async getCourseTitles(lang: "ar" | "en"): Promise<string[]> {
    const coursesData = await readCoursesFile();
    return coursesData.courses.map(course => course.title[lang]);
  },

  /**
   * UPDATE COURSE BY ID
   */
  async updateCourse(id: number, data: Partial<CourseCreateInput>): Promise<Course | null> {
    const coursesData = await readCoursesFile();
    const courseIndex = coursesData.courses.findIndex(course => course.id === id);
    
    if (courseIndex === -1) {
      return null; // Course not found
    }
    
    // Update the course
    if (data.title) {
      coursesData.courses[courseIndex]!.title = data.title;
    }
    if (data.link) {
      coursesData.courses[courseIndex]!.link = data.link;
    }
    
    await writeCoursesFile(coursesData);
    return coursesData.courses[courseIndex]!;
  },
};
