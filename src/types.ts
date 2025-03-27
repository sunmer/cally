export type ScheduleEvent = {
  id: number;
  title: string;
  description: string;
  start: string;
  end: string;
};

export type Schedule = {
  title: string;
  events: ScheduleEvent[];
  requiresAdditionalContent: boolean
};