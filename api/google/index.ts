import { query } from "../db.js";
import { Schedule, CreateScheduleGoogleAPI, GoogleTokenResponse, GOOGLE_OAUTH_PREFIX, DeleteScheduleGoogleAPI } from "../types.js";
import { allowCors, getGoogleTokenFromCookie, withAuth } from "../util.js";
import { google } from 'googleapis';

const isProd = process.env.VERCEL_ENV === 'production';

const WEB_URL = isProd ?
  `https://calera.io` :
  `http://localhost:5173`;

const COOKIE_DOMAIN = '.calera.io';

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Define Google Calendar API scopes
const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.events'
];

async function handler(req, res) {
  const { type } = req.query;

  if (req.method === 'GET' && type === 'auth-check') {
    await checkAuth(req, res);
  } else if (req.method === 'GET' && type === 'auth') {
    await getAuthUrl(req, res);
  } else if (req.method === 'GET' && type === 'logout') {
    await withAuth(logout)(req, res);
  } else if (req.method === 'GET' && type === 'auth-callback') {
    await handleAuthCallback(req, res);
  } else if (req.method === 'POST' && type === 'add-schedule') {
    return withAuth(addScheduleToCalendar)(req, res);
  } else if (req.method === 'DELETE' && type === 'delete-schedule') {
    await withAuth(deleteScheduleFromCalendar)(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Check if user is authenticated
async function checkAuth(req, res) {
  const token = getGoogleTokenFromCookie(req);
  if (!token || !token.access_token) {
    return res.status(200).json({ authenticated: false });
  }

  // Check if the token is expired
  if (!token.expiry_date || Date.now() >= token.expiry_date) {
    return res.status(401).json({ authenticated: false, error: 'Token expired' });
  }

  // Optionally, if you want to refresh tokens when close to expiration (e.g., within 5 minutes)
  if (token.expiry_date - Date.now() < 300000) { // less than 5 minutes left
    try {
      oauth2Client.setCredentials({
        ...token,
        scope: typeof token.scope === 'string' ? token.scope : undefined
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      setTokenCookie(res, credentials);
      // Update token with new credentials if needed
    } catch (error) {
      console.error('Error refreshing token:', error);
      return res.status(401).json({ authenticated: false, error: 'Unable to refresh token' });
    }
  }

  return res.status(200).json({ authenticated: true });
}

async function logout(req, res) {
  try {
    // Get the token to potentially revoke it
    const googleTokenResponse = getGoogleTokenFromCookie(req);

    // Try to revoke the token if it exists
    if (googleTokenResponse && googleTokenResponse.access_token) {
      try {
        // Set credentials for revocation
        oauth2Client.setCredentials({
          ...googleTokenResponse,
          scope: typeof googleTokenResponse.scope === 'string' ? googleTokenResponse.scope : undefined
        });

        // Revoke access token
        await oauth2Client.revokeToken(googleTokenResponse.access_token);
        console.log('Token successfully revoked');
      } catch (revokeError) {
        // Continue with logout even if revocation fails
        console.error('Error revoking token:', revokeError);
      }
    }

    // Use the same cookie settings format as setTokenCookie
    const baseCookieSettings = `HttpOnly; Path=/; Max-Age=0`;
    const cookieSettings = isProd
      ? `${baseCookieSettings}; Secure; SameSite=Lax; Domain=${COOKIE_DOMAIN}`
      : baseCookieSettings;

    res.setHeader('Set-Cookie', [`google_auth_token=; ${cookieSettings}`]);
    console.log('User logged out successfully');

    return res.status(200).json({
      authenticated: false,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ error: 'Logout process failed' });
  }
}

// Generate Google OAuth URL
async function getAuthUrl(_req, res) {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    return res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
}

// Handle Google OAuth callback
async function handleAuthCallback(req, res) {
  const code = req.query?.code;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    let tokens;
    try {
      const response = await oauth2Client.getToken(code);
      tokens = response.tokens;
    } catch (error) {
      console.error('Error getting tokens from code:', error);
      return res.status(500).json({ error: 'Failed to exchange authorization code for tokens' });
    }

    setTokenCookie(res, tokens);
    return res.redirect(WEB_URL);
  } catch (error) {
    console.error('Error handling auth callback:', error);
    return res.status(500).json({ error: 'Failed to complete authentication' });
  }
}

// Add events to Google Calendar
async function addScheduleToCalendar(req, res) {
  try {
    // Expecting the request body to match the new CalendarSchedule type
    const schedule = req.body as Schedule;

    if (!schedule || !Array.isArray(schedule.events)) {
      return res.status(400).json({ error: 'Calendar schedule with events array is required' });
    }

    const googleTokenResponse = getGoogleTokenFromCookie(req);

    oauth2Client.setCredentials({
      ...googleTokenResponse,
      scope: typeof googleTokenResponse?.scope === 'string' ? googleTokenResponse.scope : undefined
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const results: any[] = [];

    for (const event of schedule.events) {
      const eventLink = `${WEB_URL}/events/${schedule.uuid}/${event.id}`;
      
      const calendarEvent: CreateScheduleGoogleAPI = {
        id: event.googleId,
        summary: event.title,
        description: `${event.description}\n\nLink to ${event.title}: ${eventLink}`,
        start: {
          dateTime: new Date(event.start).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(event.end).toISOString(),
          timeZone: 'UTC'
        },
        source: {
          title: `Link to ${event.title}`,
          url: eventLink
        }
      };

      try {
        const result = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: calendarEvent
        });
        if (result.data) {
          results.push(result.data);
        }
      } catch (error) {
        console.error(`Error adding event "${calendarEvent.summary}":`, error);
        return res.status(500).json({ error: `Failed to add event "${calendarEvent.summary}"` });
      }
    }

    return res.status(200).json({ success: true, events: results });
  } catch (error) {
    console.error('Error adding events to calendar:', error);
    return res.status(500).json({ error: 'Failed to add events to calendar' });
  }
}

async function deleteScheduleFromCalendar(req, res) {
  try {
    // Extract the schedule UUID from the request body
    const { uuid } = req.body;

    if (!uuid) {
      return res.status(400).json({ error: 'Schedule UUID is required' });
    }

    const googleTokenResponse = getGoogleTokenFromCookie(req);

    oauth2Client.setCredentials({
      ...googleTokenResponse,
      scope: typeof googleTokenResponse?.scope === 'string' ? googleTokenResponse.scope : undefined
    });

    // Fetch the schedule to get the events
    const scheduleResult = await query(
      `SELECT events 
       FROM schedules s
       JOIN users u ON s.user_id = u.id
       WHERE s.uuid = $1 AND u.sub = $2`,
      [uuid, GOOGLE_OAUTH_PREFIX + req.user.sub]
    );

    if (scheduleResult.rowCount === 0) {
      return res.status(404).json({ error: 'Schedule not found or not owned by current user' });
    }

    const events = scheduleResult.rows[0].events;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Explicitly type the results array
    const results: DeleteScheduleGoogleAPI[] = [];

    // Delete each event from Google Calendar
    for (const event of events) {
      if (event.googleId) {
        try {
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: event.googleId
          });
          results.push({
            eventId: event.id,
            googleId: event.googleId,
            deleted: true
          });
        } catch (error) {
          console.error(`Error deleting event with googleId "${event.googleId}":`, error);
          results.push({
            eventId: event.id,
            googleId: event.googleId,
            deleted: false,
            error: (error as any).message
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Events deleted from Google Calendar'
    });
  } catch (error) {
    console.error('Error deleting events from calendar:', error);
    return res.status(500).json({ error: 'Failed to delete events from calendar' });
  }
}

function setTokenCookie(res, tokens: GoogleTokenResponse): void {
  const baseCookieSettings = `HttpOnly; Path=/; Max-Age=604800`;
  let cookieSettings = isProd
    ? `${baseCookieSettings}; Secure; SameSite=Lax; Domain=${COOKIE_DOMAIN}`
    : baseCookieSettings;
  res.setHeader('Set-Cookie', [
    `google_auth_token=${JSON.stringify(tokens)}; ${cookieSettings}`
  ]);
}

export default allowCors(handler);
