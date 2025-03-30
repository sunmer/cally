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

// OPTIONS handler for preflight requests
export async function OPTIONS(req) {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}

// GET handler to stream the response
export async function GET(req) {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const description = searchParams.get('description');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!title || !description || !start || !end) {
    return new Response(JSON.stringify({
      error: 'Missing event fields. Required: title, description, start, end.'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  const systemPrompt = `Using the following event details:

Title: ${title}
Description: ${description}
Start: ${start}
End: ${end}

Analyze these event details to assess the session’s complexity and engagement level. If the session appears structured as a challenge, routine, or interactive activity that would benefit from additional engagement, generate a complete, self-contained lesson with engaging content and examples in Markdown format.

After the lesson, on a new line output exactly the following delimiter:

<<<FOLLOW-UP-QUESTIONS>>>

Then, on the next line, output a valid JSON array containing exactly three follow-up questions that encourage the reader to reflect and test their understanding. There should be no additional text or markdown formatting around the JSON array.

If the session does not warrant extra engagement, output only the Markdown lesson without the delimiter or JSON array.`;

  const response = await streamText({
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    system: systemPrompt,
    model: openai('gpt-4o-mini-2024-07-18'),
    messages: [{ role: 'user', content: 'Please generate the lesson.' }]
  });

  return response.toTextStreamResponse({
    headers: {
      'Content-Type': 'text/event-stream',
      ...corsHeaders
    }
  });
}
