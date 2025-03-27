export type ScheduleEvent = {
  id: number;
  title: string;
  description: string;
  content: string;
  questions: string[];
  start: string;
  end: string;
};

export type Schedule = {
  uuid?: string;
  title: string;
  events: ScheduleEvent[];
  requiresAdditionalContent: boolean
};