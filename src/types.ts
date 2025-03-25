export type CalendarEventItem = {
  title: string;
  description: string;
  start: string;
  end: string;
};

export type CalendarSchedule = {
  title: string;
  events: CalendarEventItem[];
  requiresAdditionalContent: boolean
};