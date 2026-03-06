/**
 * Event Service - Scrapes events from AOU website
 */

import * as cheerio from "cheerio";
import { getCachedUpcomingEvents } from "../schedulers/eventScheduler";

export interface Event {
  title: string;
  date: string;
  formattedDate: string;
  description: string;
  link: string;
  isUpcoming: boolean;
  day: string;
  month: string;
  year: string;
}

/**
 * Get current Saudi time
 */
function getSaudiTime(): Date {
  const now = new Date();
  const saudiOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + saudiOffset);
}

/**
 * Convert Arabic date to formatted date (YYYY-MM-DD)
 */
function convertArabicDate(arabicDate: string): string {
  const arabicMonths: Record<string, string> = {
    'يناير': '01',
    'فبراير': '02',
    'مارس': '03',
    'أبريل': '04',
    'مايو': '05',
    'يونيو': '06',
    'يوليو': '07',
    'أغسطس': '08',
    'سبتمبر': '09',
    'أكتوبر': '10',
    'نوفمبر': '11',
    'ديسمبر': '12'
  };

  try {
    const parts = arabicDate.split(' ');
    if (parts.length === 3) {
      const [day, monthAr, year] = parts;
      const month = monthAr && arabicMonths[monthAr] ? arabicMonths[monthAr] : '00';
      return `${year}-${month}-${(day || '').padStart(2, '0')}`;
    }
  } catch {
    // Return original date if conversion fails
  }
  return arabicDate;
}

/**
 * Check if event date is in the future
 */
function isFutureEvent(dateStr: string): boolean {
  try {
    const eventDate = new Date(dateStr);
    const currentTime = getSaudiTime();
    return eventDate > currentTime;
  } catch {
    return false;
  }
}

/**
 * Scrape events from AOU website
 */
export async function scrapeArabouEvents(): Promise<Event[]> {
  const url = "https://www.arabou.edu.sa/ar/media/Pages/events.aspx";

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    const $ = cheerio.load(content);
    const events: Event[] = [];

    // Try different selectors for event items
    const eventItems = $('.event-item, .event-card, .news-item, .event-row, .ms-rteTable-default');

    eventItems.each((_, element) => {
      try {
        const $el = $(element);

        // Try to extract date
        let day = '';
        let month = '';
        let year = '';
        let fullDate = 'غير محدد';

        const dateDiv = $el.find('.event-date, .date, .event-day, .event-month, .event-year');
        if (dateDiv.length > 0) {
          const dateText = dateDiv.text().trim();
          // Try to parse Arabic date format
          const dateMatch = dateText.match(/(\d{1,2})\s*([^\d\s]+)\s*(\d{4})/);
          if (dateMatch && dateMatch[1] && dateMatch[2] && dateMatch[3]) {
            day = dateMatch[1];
            month = dateMatch[2];
            year = dateMatch[3];
            fullDate = `${day} ${month} ${year}`;
          } else {
            fullDate = dateText;
          }
        }

        // Try to extract title and link
        let title = 'لا عنوان';
        let link = '';

        const titleLink = $el.find('a').first();
        if (titleLink.length > 0) {
          title = titleLink.text().trim() || title;
          const href = titleLink.attr('href');
          if (href) {
            link = href.startsWith('http') ? href : `https://www.arabou.edu.sa${href}`;
          }
        }

        // Try to extract description
        const descDiv = $el.find('.event-desc, .description, .summary, p').first();
        const description = descDiv.text().trim() || '';

        // Convert date and check if upcoming
        const eventDate = convertArabicDate(fullDate);
        const isUpcoming = isFutureEvent(eventDate);

        events.push({
          title,
          date: fullDate,
          formattedDate: eventDate,
          description,
          link,
          isUpcoming,
          day,
          month,
          year
        });
      } catch {
        // Skip this event if parsing fails
      }
    });

    return events;
  } catch (error) {
    console.error('Error scraping AOU events:', error);
    return [];
  }
}

/**
 * Get upcoming events only (from cache)
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  return await getCachedUpcomingEvents();
}

/**
 * Get all events (past and upcoming)
 */
export async function getAllEvents(): Promise<Event[]> {
  return await scrapeArabouEvents();
}
