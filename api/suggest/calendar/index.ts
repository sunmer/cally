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

  const systemPrompt = `
You are a helpful calendar assistant. Generate a valid JSON response based on the user's request. The JSON must include:
- "title": a concise description (max 3 words)
- "requiresAdditionalContent": a boolean flag that is true if the schedule requires extra LLM-generated content (such as detailed guidance or educational materials) and false if it is a simple routine.
- "events": an array of event objects, each containing:
   - "title": the event title. If "requiresAdditionalContent" is true, generate a realistic and specific title that accurately reflects the event's subject; avoid generic placeholders.
   - "description": a baseline event description. For events where "requiresAdditionalContent" is true, this should be succinct to serve as a placeholder for later content generation. Otherwise, it can be more detailed.
   - "start": start datetime in ISO 8601 format (e.g., "2025-03-25T09:00:00Z")
   - "end": end datetime in ISO 8601 format

Important scheduling rules:
1. Each event must have a realistic duration (no less than 15 minutes and no longer than 8 hours).
2. Event start and end times must be distinct.
3. If a specific date is not provided, use ${isoTomorrow} as the base date.
4. For multiple events, ensure they do not overlap and are reasonably spaced.
5. For recurring or multi-day challenges, generate separate event entries for each occurrence with appropriate spacing.
6. Determine "requiresAdditionalContent" by assessing the complexity of the request:
   - Use false for straightforward or routine challenges.
   - Use true if the request implies extra guidance or dynamic instructions; in this case, generate specific, realistic event titles and keep descriptions succinct.
7. Ensure that all event "start" times are exactly at the hour (e.g., "09:00:00Z") or half past the hour (e.g., "09:30:00Z").

Example generalized response format:
{
  "title": "Concise Title",
  "requiresAdditionalContent": true,
  "events": [
    {
      "title": "Specific Event Title",
      "description": "Brief description",
      "start": "2025-03-25T09:00:00Z",
      "end": "2025-03-25T10:30:00Z"
    }
  ]
};
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
