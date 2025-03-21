export const GOOGLE_OAUTH_PREFIX = 'google:';

export type CalendarEventItem = {
  title: string;
  description: string;
  start: string;
  end: string;
};

export type CalendarSchedule = {
  title: string;
  events: CalendarEventItem[];
};

export type GoogleCalendarEvent = {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
};
