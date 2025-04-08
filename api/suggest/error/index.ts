import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Helper to generate CORS headers based on the request's origin
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'https://calera.io',
    'https://www.calera.io',
    // In non-production environments also allow localhost origins.
    ...(process.env.VERCEL_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000'])
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

// POST handler to process error and return AI-generated fix
export async function POST(req) {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Parse the JSON body from the POST request.
    const errorData = await req.json();

    // Validate that errorData is an object with a non-empty "message" property.
    if (!errorData || typeof errorData.message !== 'string' || errorData.message.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'Missing or invalid error data. The error message is required.'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Destructure error fields, providing default values for optional ones.
    const {
      message,
      stack = '',
      fileName = '',
      lineNumber = '',
      columnNumber = '',
      codeContext = ''
    } = errorData;

    // Construct the system prompt with available error information.
    const systemPrompt = `You are an expert JavaScript and TypeScript developer helping to debug and fix frontend code errors.

Given the following error information:

Error Message: ${message}
${stack ? `Stack Trace: ${stack}` : ''}
${fileName ? `File: ${fileName}` : ''}
${lineNumber ? `Line Number: ${lineNumber}` : ''}
${columnNumber ? `Column: ${columnNumber}` : ''}

${codeContext ? `Code Context:\n\`\`\`\n${codeContext}\n\`\`\`` : ''}

First, analyze the error and identify the root cause.

Then, return a JSON response with these fields:
1. "issue": A brief, clear explanation of what caused the error in plain language (1-2 sentences)
2. "fix": Step-by-step instructions to fix the problem (numbered list, concise steps)
3. "codeExample": A small code snippet showing the solution if applicable

Format your response as valid JSON that can be parsed by JavaScript's JSON.parse(). Do not include any markdown formatting, explanations, or text outside the JSON structure.

The response should be highly specific to the error and not generic. Focus on practical, actionable solutions.`;

    // Stream the response using the streamText utility.
    const response = await streamText({
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      system: systemPrompt,
      model: openai('gpt-4o-mini-2024-07-18'),
      messages: [{ role: 'user', content: 'Please analyze the error and provide a solution.' }]
    });

    // Return the streaming response as a text event stream with CORS headers.
    return response.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({
        issue: "Error processing request",
        fix: "Please check your input format or try again later",
        codeExample: null
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}
