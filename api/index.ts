import { allowCors } from "./util.js";
import { google } from 'googleapis';


const isProd = process.env.VERCEL_ENV === 'production';

const WEB_URL = isProd ?
  `https://cally-chi.vercel.app/` :
  `http://localhost:5173/`;


interface CalendarEvent {
  title?: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  } | string;
  end: {
    dateTime?: string;
    date?: string;
  } | string;
}

interface GoogleCalendarEvent {
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
}

export interface TokenResponse {
  refresh_token?: string | null;
  access_token?: string | null;
  token_type?: string | null;
  id_token?: string | null;
  expiry_date?: number | null;
  scope?: string | string[] | null;
}

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Define Google Calendar API scopes
const SCOPES = ['openid', 'https://www.googleapis.com/auth/calendar'];

async function handler(req, res) {
  const { type } = req.query; // Extract query parameter

  if (req.method === 'GET' && type === 'google/auth-check') {
    await checkAuth(req, res);
  } else if (req.method === 'GET' && type === 'google/auth') {
    await getAuthUrl(req, res);
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
    
    if (!token) {
      return res.status(200).json({ authenticated: false });
    }
    
    oauth2Client.setCredentials({
      ...token,
      scope: typeof token.scope === 'string' ? token.scope : undefined
    });
    
    // Wrap the calendar list call in a try-catch to catch authentication issues
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    try {
      await calendar.calendarList.list();
    } catch (error) {
      console.error('Error listing calendars:', error);
      // Return an unauthorized error if the token is invalid or expired.
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
    
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(200).json({ authenticated: false });
  }
}

// Generate Google OAuth URL
async function getAuthUrl(req, res) {
  try {
    console.log(req)
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force consent screen to get refresh_token
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
    // Exchange code for tokens with a try-catch around the getToken call.
    let tokens;
    try {
      const response = await oauth2Client.getToken(code);
      tokens = response.tokens;
    } catch (error) {
      console.error('Error getting tokens from code:', error);
      return res.status(500).json({ error: 'Failed to exchange authorization code for tokens' });
    }
    
    // Store tokens securely (using HTTP-only cookies in this example)
    setTokenCookie(res, tokens);
    
    // Redirect to the app's main page
    return res.redirect(WEB_URL);
  } catch (error) {
    console.error('Error handling auth callback:', error);
    return res.status(500).json({ error: 'Failed to complete authentication' });
  }
}

// Add events to Google Calendar
async function addToCalendar(req, res) {
  try {
    const { events } = req.body as { events: CalendarEvent[] };
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Events array is required' });
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
    
    // Add each event to Google Calendar with its own error handling
    for (const event of events) {
      const calendarEvent: GoogleCalendarEvent = {
        summary: event.title || event.summary || '',
        description: event.description || '',
        start: {
          dateTime: new Date(typeof event.start === 'string' ? event.start : (event.start.dateTime || '')).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(typeof event.end === 'string' ? event.end : (event.end.dateTime || '')).toISOString(),
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
        // Return error immediately for the problematic event; alternatively, you could log and continue.
        return res.status(500).json({ error: `Failed to add event "${calendarEvent.summary}"` });
      }
    }
    
    return res.status(200).json({ success: true, events: results });
  } catch (error) {
    console.error('Error adding events to calendar:', error);
    return res.status(500).json({ error: 'Failed to add events to calendar' });
  }
}

// Original function for suggesting calendar events
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

  const systemPrompt = 
`Please generate a valid JSON array of calendar events based on this request: "${text}".
- If the user does **not** provide a specific date, default the first event to **start from next week**.
- If the user specifies a date, use that date.
- All dates must be in **ISO 8601 format** (e.g., "2025-03-25T09:00:00Z").
- Do **not** return any markdown formatting or explanations, just raw JSON.

Example response:
[
  {
    "title": "Event Title",
    "description": "Detailed description of the event",
    "start": "2025-03-25T09:00:00Z",
    "end": "2025-03-25T10:00:00Z"
  }
]`;

  const messages: Message[] = [
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
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const responseData = await response.json();

    // Return the JSON result
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error processing OpenAI request:', error);
    return res.status(500).json({ error: 'Error processing OpenAI request' });
  }
}

// Helper functions for token management
function getTokenFromCookie(req): TokenResponse | null {
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
  const baseCookieSettings = `HttpOnly; Path=/; Max-Age=604800`; // 7 days (adjust as needed)

  let cookieSettings = isProd
    ? `${baseCookieSettings}; Secure; SameSite=Lax; Domain=.cally-chi.vercel.app`
    : baseCookieSettings; // No Secure, SameSite, or Domain in dev

  res.setHeader('Set-Cookie', [
    `google_auth_token=${JSON.stringify(tokens)}; ${cookieSettings}`
  ]);
}


export default allowCors(handler);
