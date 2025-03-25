import { allowCors } from "../util.js";

async function handler(req, res) {
  if (req.method === 'POST') {
    const type = req.query.type;
    
    if (type === 'generate') {
      await generate(req, res);
    } else if (type === 'suggest') {
      await suggest(req, res);
    } else {
      return res.status(400).json({ error: "Missing or invalid 'type' query parameter. Use 'generate' or 'suggest'." });
    }
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
    `You are a helpful calendar assistant. Generate a valid JSON response based on the user's request. The JSON must include:
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

Example generalized response format:
{
  "title": "Concise Title",
  "requiresAdditionalContent": true,
  "events": [
    {
      "title": "Specific Event Title",
      "description": "Brief description",
      "start": "2025-03-25T09:00:00Z",
      "end": "2025-03-25T09:45:00Z"
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




async function generate(req, res) {
  let event;
  try {
    event = req.body;
    if (!event.title || !event.description || !event.start || !event.end) {
      return res.status(400).json({ error: 'Missing event fields. Required: title, description, start, end.' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const systemPrompt = `Using the following event details:

Title: ${event.title}
Description: ${event.description}
Start: ${event.start}
End: ${event.end}

Analyze the event details to assess the session’s complexity and engagement level. If the session appears to be structured as a challenge, routine, or interactive activity that would benefit from additional engagement, generate a complete, self-contained lesson with engaging content and examples. Then, at the end of the lesson, include three follow-up questions presented one at a time that encourage the reader to reflect and test their understanding. If the session does not warrant extra engagement, generate the lesson without any follow-up questions.

Return your output as a JSON object with the following format:
{
  "response": "The complete lesson text",
  "questions": ["First follow-up question", "Second follow-up question", "Third follow-up question"]
}`;
  
  const messages = [
    { role: 'system', content: systemPrompt }
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI request failed: ${errorText}`);
    }

    const responseData = await response.json();
    // Return the final JSON with keys "response" and "questions"
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error processing OpenAI request:', error);
    return res.status(500).json({ error: 'Error processing OpenAI request' });
  }
}



export default allowCors(handler);
