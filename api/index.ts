import { CalendarSchedule, GoogleCalendarEvent } from "./types.js";
import { allowCors } from "./util.js";
import { google } from 'googleapis';

const isProd = process.env.VERCEL_ENV === 'production';

const WEB_URL = isProd ?
  `https://cally-chi.vercel.app/` :
  `http://localhost:5173/`;

const COOKIE_DOMAIN = '.cally-chi.vercel.app';


export type TokenResponse = {
  refresh_token?: string | null;
  access_token?: string | null;
  token_type?: string | null;
  id_token?: string | null;
  expiry_date?: number | null;
  scope?: string | string[] | null;
};

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Define Google Calendar API scopes
const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar'];

async function handler(req, res) {
  const { type } = req.query; // Extract query parameter

  if (req.method === 'GET' && type === 'google/auth-check') {
    await checkAuth(req, res);
  } else if (req.method === 'GET' && type === 'google/auth') {
    await getAuthUrl(req, res);
  } else if (req.method === 'GET' && type === 'google/logout') {
      await logout(req, res);
  } else if (req.method === 'GET' && type === 'google/auth-callback') {
    await handleAuthCallback(req, res);
  } else if (req.method === 'POST' && type === 'google/calendar-add') {
    await addToCalendar(req, res);
  } else if (req.method === 'POST' && type === 'google/calendar-suggest') {
    await suggest(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Check if user is authenticated
async function checkAuth(req, res) {
  try {
    const token = getTokenFromCookie(req);

    if (!token || !token.access_token) {
      return res.status(200).json({ authenticated: false });
    }

    oauth2Client.setCredentials({
      ...token,
      scope: typeof token.scope === 'string' ? token.scope : undefined
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    try {
      // Verify token is valid by making a calendar API request
      await calendar.calendarList.list();
      
      // If successful, extract user info (optional)
      let userInfo = {};
      try {
        const tokenInfo = await oauth2Client.getTokenInfo(token.access_token);
        userInfo = {
          email: tokenInfo.email,
          sub: tokenInfo.sub,
          // Don't include sensitive token details
        };
      } catch (error) {
        console.error('Error getting user info:', error);
        // Continue anyway since we verified calendar access
      }
      
      // Make sure token is fresh by refreshing it if needed
      if (token.expiry_date && Date.now() > token.expiry_date - 300000) { // Refresh if < 5 mins left
        const { credentials } = await oauth2Client.refreshAccessToken();
        // Update token in cookie
        setTokenCookie(res, credentials);
      }
      
      // Return authenticated status with minimal user info (no tokens)
      return res.status(200).json({ 
        authenticated: true,
        user: userInfo 
      });
      
    } catch (error) {
      console.error('Error verifying token:', error);
      // Clear invalid token cookie
      res.setHeader('Set-Cookie', [`google_auth_token=; HttpOnly; Path=/; Max-Age=0`]);
      return res.status(401).json({ authenticated: false, error: 'Invalid or expired authentication token' });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(200).json({ authenticated: false });
  }
}

async function logout(req, res) {
  try {
    // Get the token to potentially revoke it
    const token = getTokenFromCookie(req);
    
    // Try to revoke the token if it exists
    if (token && token.access_token) {
      try {
        // Set credentials for revocation
        oauth2Client.setCredentials({
          ...token,
          scope: typeof token.scope === 'string' ? token.scope : undefined
        });
        
        // Revoke access token
        await oauth2Client.revokeToken(token.access_token);
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
async function addToCalendar(req, res) {
  try {
    // Expecting the request body to match the new CalendarSchedule type
    const schedule = req.body as CalendarSchedule;

    if (!schedule || !Array.isArray(schedule.events)) {
      return res.status(400).json({ error: 'Calendar schedule with events array is required' });
    }

    const token = getTokenFromCookie(req);

    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    oauth2Client.setCredentials({
      ...token,
      scope: typeof token.scope === 'string' ? token.scope : undefined
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const results: any[] = [];

    for (const event of schedule.events) {
      const calendarEvent: GoogleCalendarEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: new Date(event.start).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(event.end).toISOString(),
          timeZone: 'UTC'
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

// Suggest calendar events based on a text request
async function suggest(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let text: string;

  try {
    text = req.body.text;
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoTomorrow = tomorrow.toISOString();

  const systemPrompt =
    `You are a helpful calendar assistant. Generate a valid JSON response based on the user's request. The JSON must have a "title" key with a concise description (max 3 words) and an "events" key containing an array of event objects. Each event object should include:
- "title": the event title
- "description": detailed description of the event
- "start": start datetime in ISO 8601 format (e.g., "2025-03-25T09:00:00Z")
- "end": end datetime in ISO 8601 format

Important scheduling rules:
1. Each event must have a realistic duration (no events shorter than 15 minutes or longer than 8 hours)
2. Events must have different start and end times
3. If a specific date is not provided, use ${isoTomorrow} as the base date
4. For multiple events, ensure they don't overlap and have reasonable spacing between them

Example response:
{
  "title": "Daily Schedule",
  "events": [
    {
      "title": "Morning Event",
      "description": "Description of morning event",
      "start": "2025-03-25T09:00:00Z",
      "end": "2025-03-25T10:30:00Z"
    },
    {
      "title": "Afternoon Event",
      "description": "Description of afternoon event",
      "start": "2025-03-25T13:00:00Z",
      "end": "2025-03-25T14:00:00Z"
    }
  ]
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        messages: messages,
        stream: false,
        response_format: { "type": "json_object" },
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text(); // Capture full response
      console.error('OpenAI API Error:', errorText); // Log full response
      throw new Error(`OpenAI request failed: ${errorText}`);
    }

    const responseData = await response.json();
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error processing OpenAI request:', error);
    return res.status(500).json({ error: 'Error processing OpenAI request' });
  }
}

// Helper to extract token from cookie
export function getTokenFromCookie(req): TokenResponse | null {
  try {
    const tokenCookie = req.cookies?.['google_auth_token'];
    if (!tokenCookie) return null;

    return JSON.parse(tokenCookie);
  } catch (error) {
    console.error('Error parsing token from cookie:', error);
    return null;
  }
}

function setTokenCookie(res, tokens: TokenResponse): void {
  const baseCookieSettings = `HttpOnly; Path=/; Max-Age=604800`;
  let cookieSettings = isProd
    ? `${baseCookieSettings}; Secure; SameSite=Lax; Domain=${COOKIE_DOMAIN}`
    : baseCookieSettings;
  res.setHeader('Set-Cookie', [
    `google_auth_token=${JSON.stringify(tokens)}; ${cookieSettings}`
  ]);
}

export default allowCors(handler);
