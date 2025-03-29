export const config = {
  runtime: 'edge',
};

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
3. If a specific date is not provided, use tomorrow’s date as the base date.
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
}
`.trim();

export default async function handler(req: Request) {
  // Use POST since we expect a JSON body with a "text" property.
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let text: string;
  try {
    const body = await req.json();
    text = body.text;
    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing "text"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Replace the placeholder with tomorrow's date.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoTomorrow = tomorrow.toISOString();
  const promptWithDate = systemPrompt.replace('tomorrow’s date', isoTomorrow);

  const messages = [
    { role: 'system', content: promptWithDate },
    { role: 'user', content: text },
  ];

  // Call the OpenAI API with streaming enabled.
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-2024-07-18', // Ensure this model supports JSON mode
      messages,
      stream: true,
      temperature: 0,
      response_format: { "type": "json_object" },
    }),
  });

  if (!response.ok || !response.body) {
    return new Response('Failed to connect to OpenAI', { status: 500 });
  }

  // Stream the raw chunks directly to the client without parsing them.
  const stream = new ReadableStream({
    async start(controller) {
      // We know response.body is not null from the check above
      const reader = response.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (err) {
        console.error('Stream error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
