import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Helper to generate CORS headers based on the request's origin
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'https://calera.io',
    'https://www.calera.io',
    ...(process.env.VERCEL_ENV === 'production' ? [] : ['http://localhost:5173'])
  ];
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers':
      'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  };

  if (allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }
  return corsHeaders;
}

// Explicitly export an OPTIONS handler for preflight requests
export async function OPTIONS(req) {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

// This method must be named GET
export async function GET(req) {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';

  // Use tomorrow as the fallback date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoTomorrow = tomorrow.toISOString();

  const systemPrompt = 
`You are a helpful calendar assistant. When generating a JSON response based on the user's request, first parse the text to detect any date or time references. The JSON must include:
- "title": a concise description (max 3 words)
- "requiresAdditionalContent": a boolean flag indicating if extra detailed guidance is needed.
- "events": an array of event objects, each with:
   - "title": the event title. If "requiresAdditionalContent" is true, generate a specific title; avoid generic placeholders.
   - "description": a baseline event description. If "requiresAdditionalContent" is true, keep it succinct.
   - "start": start datetime in ISO 8601 format (e.g., "2025-03-25T09:00:00Z")
   - "end": end datetime in ISO 8601 format

Important scheduling rules:
1. CRITICAL: If a specific time is mentioned (e.g., "9am", "3:30pm"), you MUST use exactly that time for the event. Never substitute or adjust explicitly mentioned times.
2. If a specific date is mentioned, use that date; if none is detected, use ${isoTomorrow}.
3. Each event must have a realistic duration (no less than 15 minutes and no longer than 8 hours).
4. For tasks without a specified duration, use a sensible default based on the nature of the task.
5. Event start and end times must be distinct.
6. For multiple events, ensure they do not overlap and are reasonably spaced.
7. For recurring or multi-day challenges, generate separate event entries for each occurrence.
8. Only set events at the hour or half-hour when NO specific time is mentioned. Otherwise, use the exact time specified in the request.
`;

  const response = await streamText({
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    system: systemPrompt,
    model: openai('gpt-4o-mini-2024-07-18'),
    messages: [{ role: 'user', content: text }]
  });

  // Return the streaming response including CORS headers
  return response.toTextStreamResponse({
    headers: {
      'Content-Type': 'text/event-stream',
      ...corsHeaders
    }
  });
}