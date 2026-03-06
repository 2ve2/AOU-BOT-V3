import { promises as fs } from 'fs';
import * as path from 'path';
import type { AcademicCalendarCreateInput, AcademicCalendar } from '@/types/schemas';
const CALENDAR_FILE_PATH = path.join(process.cwd(), 'src/data/calendars.json');

interface CalendarData {
  academicCalendar: AcademicCalendar[];
}
/**
 * Read Academic Calendar from JSON file
 */
async function readCalendarFile(): Promise<CalendarData> {
  try {
    const data = await fs.readFile(CALENDAR_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty structure
    return { academicCalendar: [] };
  }
}
/**
 * Write Academic Calendar to JSON file
 */
async function writeCalendarFile(data: CalendarData): Promise<void> {
  await fs.writeFile(CALENDAR_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
export const calendarService = {
  /**
   * CREATE A NEW CALENDAR
   */
  async createCalendarEvent(data: AcademicCalendarCreateInput): Promise<AcademicCalendar> {
    const calendarData = await readCalendarFile();
    
    const newCalendar: AcademicCalendar = {
      id: Date.now(), // Generate unique ID based on timestamp
      title: data.title,
      answer: data.answer,
    };
    
    calendarData.academicCalendar.push(newCalendar);
    await writeCalendarFile(calendarData);
    
    return newCalendar;
  },
  /**
   * GET ALL CALENDARS
   */
  async getAllCalendars(): Promise<AcademicCalendar[]> {
    const calendarData = await readCalendarFile();
    return calendarData.academicCalendar;
  },
  /**
   * DELETE CALENDAR BY ID
   */
  async deleteCalendar(id: number): Promise<boolean> {
    const calendarData = await readCalendarFile();
    
    const initialLength = calendarData.academicCalendar.length;
    calendarData.academicCalendar = calendarData.academicCalendar.filter(event => event.id !== id);
    
    if (calendarData.academicCalendar.length === initialLength) {
      return false; // calendar not found
    }
    
    await writeCalendarFile(calendarData);
    return true;
  },
  /**
   * GET CALENDAR BY ID
   */
  async getCalendarById(id: number): Promise<AcademicCalendar | undefined> {
    const calendarData = await readCalendarFile();
    return calendarData.academicCalendar.find(event => event.id === id);
  },
  /**
   * GET CALENDAR BY TITLE
   */
  async getCalendarByTitle(title: string, lang: "ar" | "en"): Promise<AcademicCalendar | undefined> {
    const calendarData = await readCalendarFile();
    return calendarData.academicCalendar.find(event => event.title[lang] === title);
  },
  /**
   * GET ALL CALENDAR TITLES
   */
  async getCalendarTitles(lang: "ar" | "en"): Promise<string[]> {
    const calendarData = await readCalendarFile();
    return calendarData.academicCalendar.map(event => event.title[lang]);
  },
  /**
   * UPDATE CALENDAR BY ID
   */
  async updateCalendar(id: number, data: Partial<AcademicCalendarCreateInput>): Promise<AcademicCalendar | null> {
    const calendarData = await readCalendarFile();
    const calendarIndex = calendarData.academicCalendar.findIndex(event => event.id === id);
    
    if (calendarIndex === -1) {
      return null; // calendar not found
    }
    
    // Update the calendar
    if (data.title) {
      calendarData.academicCalendar[calendarIndex]!.title = data.title;
    }
    if (data.answer) {
      calendarData.academicCalendar[calendarIndex]!.answer = data.answer;
    }
    
    await writeCalendarFile(calendarData);
    return calendarData.academicCalendar[calendarIndex]!;
  },
};