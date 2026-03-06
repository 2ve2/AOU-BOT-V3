/**
 * Event Scheduler - Auto-scrapes events every 24 hours
 */

import { scrapeArabouEvents } from "../services/eventService";
import { miftahdb } from "../../lib/miftahdbService";

const EVENTS_KEY = "upcoming_events";
const LAST_UPDATE_KEY = "events_last_update";

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
 * Save events to database
 */
async function saveEvents(events: any[]): Promise<void> {
  await miftahdb.set(EVENTS_KEY, events);
}

/**
 * Load events from database
 */
async function loadEvents(): Promise<any[]> {
  const events = await miftahdb.get(EVENTS_KEY);
  return Array.isArray(events) ? events : [];
}

/**
 * Save last update timestamp
 */
async function saveLastUpdate(): Promise<void> {
  const timestamp = getSaudiTime().toISOString();
  await miftahdb.set(LAST_UPDATE_KEY, timestamp);
}

/**
 * Get last update timestamp
 */
async function getLastUpdate(): Promise<string | null> {
  const timestamp = await miftahdb.get(LAST_UPDATE_KEY);
  return typeof timestamp === 'string' ? timestamp : null;
}

/**
 * Cleanup old events (remove past events)
 */
async function cleanupOldEvents(): Promise<void> {
  const currentEvents = await loadEvents();
  const updatedEvents = currentEvents.filter((event: any) => 
    isFutureEvent(event.formattedDate)
  );
  await saveEvents(updatedEvents);
}

/**
 * Update events from AOU website
 */
export async function updateEvents(): Promise<void> {
  try {
    console.log("🔄 Updating events from AOU website...");
    
    // Cleanup old events first
    await cleanupOldEvents();
    
    // Scrape new events
    const events = await scrapeArabouEvents();
    
    if (events.length > 0) {
      // Filter upcoming events
      const newUpcomingEvents = events.filter(event => event.isUpcoming);
      
      // Get current events
      const currentEvents = await loadEvents();
      const currentTitles = new Set(currentEvents.map((e: any) => e.title));
      
      // Add new events
      let addedCount = 0;
      for (const newEvent of newUpcomingEvents) {
        if (!currentTitles.has(newEvent.title)) {
          currentEvents.push(newEvent);
          addedCount++;
        }
      }
      
      // Save updated events
      await saveEvents(currentEvents);
      await saveLastUpdate();
      
      console.log(`✅ Events updated. Added ${addedCount} new events. Total: ${currentEvents.length}`);
    } else {
      console.log("⚠️ No events found on AOU website");
    }
  } catch (error) {
    console.error("❌ Error updating events:", error);
  }
}

/**
 * Start the event scheduler (runs every 24 hours)
 */
export function startEventScheduler(): void {
  console.log("📅 Starting event scheduler (runs every 24 hours)...");
  
  // Initial update
  updateEvents();
  
  // Schedule updates every 24 hours (86400000 ms)
  setInterval(() => {
    updateEvents();
  }, 24 * 60 * 60 * 1000);
}

/**
 * Get cached upcoming events
 */
export async function getCachedUpcomingEvents(): Promise<any[]> {
  const events = await loadEvents();
  return events.filter((event: any) => isFutureEvent(event.formattedDate));
}
