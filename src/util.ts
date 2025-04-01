import { format, parseISO } from 'date-fns';

export function formatEventDateRange(event: { start: string | Date; end: string | Date }) {
  // Parse dates but extract UTC time components directly
  const startISOString = typeof event.start === 'string' ? event.start : event.start.toISOString();
  const endISOString = typeof event.end === 'string' ? event.end : event.end.toISOString();
  
  // For month and day formatting, we can use date-fns
  const startDate = parseISO(startISOString);
  const month = format(startDate, 'MMM');
  const day = format(startDate, 'd');
  
  // Extract UTC hours and minutes directly from ISO string
  const startHours = parseInt(startISOString.split('T')[1].split(':')[0], 10);
  const startMinutes = parseInt(startISOString.split('T')[1].split(':')[1], 10);
  const endHours = parseInt(endISOString.split('T')[1].split(':')[0], 10);
  const endMinutes = parseInt(endISOString.split('T')[1].split(':')[1], 10);
  
  // Format time manually to ensure UTC
  const startTime = `${startHours % 12 || 12}:${startMinutes.toString().padStart(2, '0')}${startHours >= 12 ? 'pm' : 'am'}`;
  const endTime = `${endHours % 12 || 12}:${endMinutes.toString().padStart(2, '0')}${endHours >= 12 ? 'pm' : 'am'}`;
  
  return { month, day, startTime, endTime };
}