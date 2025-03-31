export const GOOGLE_OAUTH_PREFIX = 'google:';

export type ScheduleEvent = {
  id: number;
  googleId: string;
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

export type CreateScheduleGoogleAPI = {
  id: string;
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
  source?: {
    title: string;
    url: string;
  };
};

export type DeleteScheduleGoogleAPI = {
  eventId: any;
  googleId: any;
  deleted: boolean;
  error?: string;
};

export type GoogleTokenResponse = {
  refresh_token?: string | null;
  access_token?: string | null;
  token_type?: string | null;
  id_token?: string | null;
  expiry_date?: number | null;
  scope?: string | string[] | null;
};
