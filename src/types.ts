export type ScheduleEvent = {
  id: number;
  googleId: string;
  title: string;
  description: string;
  content: string;
  questions?: string[];
  start: string;
  end: string;
};

export type Schedule = {
  uuid?: string;
  id?: number;
  title: string;
  events: ScheduleEvent[];
  requiresAdditionalContent: boolean
};