import { allowCors } from "../util.js";

async function handler(req, res) {
  if (req.method === 'POST') {
    await suggest(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Suggest calendar events based on a text request
async function suggest(req, res) {
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
5. If ${text} needs educational content, write out some contents but also rely on external materials if needed. Be practical and action-oriented.

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
        model: "gpt-4o-mini-2024-07-18",
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


export default allowCors(handler);
