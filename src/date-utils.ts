/**
 * MLC Isometric Heatmap Library - Shared date helpers for the presets
 * Copyright (c) 2026 Michael Lechner
 * Licensed under the MIT License.
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parses any date input to a Date object. */
export function toDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date): string {
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Name of the weekday in position `index` (0-6) of a week starting at `startOfWeek`. */
export function weekdayName(index: number, startOfWeek: number): string {
  return DAY_NAMES[(index + startOfWeek) % 7];
}

/** The seven weekday names of a week starting at `startOfWeek` (0 = Sunday, 1 = Monday). */
export function weekdayNames(startOfWeek: number): string[] {
  return Array.from({ length: 7 }, (_, index) => weekdayName(index, startOfWeek));
}

/** ISO 8601 week number of a local date. */
export function isoWeek(d: Date): number {
  // The ISO week belongs to the year of its Thursday.
  const thursday = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7));
  const firstJan = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - firstJan) / 86_400_000 + 1) / 7);
}
