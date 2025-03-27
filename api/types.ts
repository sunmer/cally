export const GOOGLE_OAUTH_PREFIX = 'google:';

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

export type ScheduleToGoogleAPI = {
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

export type GoogleTokenResponse = {
  refresh_token?: string | null;
  access_token?: string | null;
  token_type?: string | null;
  id_token?: string | null;
  expiry_date?: number | null;
  scope?: string | string[] | null;
};
