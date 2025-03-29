export const config = {
  runtime: 'edge',
};

const systemPrompt = `
You are a helpful calendar assistant. Generate newline-delimited JSON (NDJSON) where each line is a valid JSON object.
For each event (not the final summary), output a JSON object with:
  - "title": a concise event title (max 3 words if it’s the summary, or a realistic event title if additional content is needed)
  - "description": a brief description (if extra content is needed, keep it succinct)
  - "start": start datetime in ISO 8601 format (exactly on the hour or half past)
  - "end": end datetime in ISO 8601 format
When all events are generated, output one final JSON object with a "title", "requiresAdditionalContent", and an "events" array that contains all events.
Important rules:
1. Each event must have a realistic duration (no less than 15 minutes and no longer than 8 hours).
2. Use tomorrow’s date (provided in the prompt) if no specific date is given.
3. Ensure events do not overlap and that times are exactly at the hour or half past.
`.trim();

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let text;
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

  // Replace placeholder with tomorrow’s date.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isoTomorrow = tomorrow.toISOString();
  const promptWithDate = systemPrompt.replace('tomorrow’s date', isoTomorrow);

  const messages = [
    { role: 'system', content: promptWithDate },
    { role: 'user', content: text },
  ];

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
      response_format: { "type": "json_object" }
    }),
  });

  if (!response.ok || !response.body) {
    return new Response('Failed to connect to OpenAI', { status: 500 });
  }

  // Transform the OpenAI stream into an NDJSON stream
  const stream = new ReadableStream({
    async start(controller) {
      // We already checked response.body is not null above
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // Split the buffered text into lines
          const lines = buffer.split("\n");
          // Process complete lines (except the last, which might be incomplete)
          for (let i = 0; i < lines.length - 1; i++) {
            let line = lines[i].trim();
            if (line) {
              // Remove any leading "data:" if present
              const cleanedLine = line.replace(/^data:\s*/, '');
              if (cleanedLine === "[DONE]") continue;
              // Try to parse the line to ensure it’s a complete JSON object
              try {
                JSON.parse(cleanedLine);
                // Enqueue the complete NDJSON line
                controller.enqueue(new TextEncoder().encode(cleanedLine + "\n"));
              } catch (e) {
                // If parsing fails, wait for more data before emitting this line
              }
            }
          }
          // Keep the last partial line in the buffer
          buffer = lines[lines.length - 1];
        }
        // Process any final buffered data
        if (buffer.trim()) {
          try {
            const cleanedLine = buffer.replace(/^data:\s*/, '').trim();
            JSON.parse(cleanedLine);
            controller.enqueue(new TextEncoder().encode(cleanedLine + "\n"));
          } catch (e) {
            console.error("Final JSON parse error:", e);
          }
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
      'Content-Type': 'application/x-ndjson',
    },
  });
}
