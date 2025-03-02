import { allowCors } from "../util.js";

interface Prompt {
  id: number;
  text: string;
}

const prompts: Prompt[] = [
  { 
    id: 1, 
    text: `You are a ThreeJS code generator. Generate code that modifies a ThreeJS scene based on this description: `
  }
];

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json("hello");
  } else if (req.method === 'POST') {
    await suggest(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function suggest(req, res) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let promptId, text;

  try {
    promptId = req.body.promptId;
    text = req.body.text;
  } catch (error) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const foundPrompt = prompts.find((p) => p.id === promptId);
  if (!foundPrompt) {
    return new Response('Prompt not found', { status: 404 });
  }

  // Instruct the model to ONLY return valid JSON (no code fences, no comments).
  const systemPrompt = `
You are a ThreeJS expert who generates code snippets that modify existing ThreeJS scenes.

The user has a room with:
- Four walls (frontWall, backWall, leftWall, rightWall)
- A floor
- A point light
- An ambient light
- Stars in the background

Your job is to return ONLY a JSON object with properties that can be used to modify the scene.
You MUST output valid JSON and NOTHING else. 
Do NOT wrap your JSON in triple backticks or any code fences.
Do NOT include line comments (//) or block comments (/* ... */) in the JSON.

Possible properties:
{
  "wallColor": "#hexcode",
  "floorColor": "#hexcode",
  "ambientLightColor": "#hexcode", 
  "ambientLightIntensity": number,
  "pointLightColor": "#hexcode",
  "pointLightIntensity": number,
  "skyColor": "#hexcode",
  "starColor": "#hexcode",
  "starSize": number,
  "starCount": number,
  "addObjects": [array of strings containing properly escaped code],
  "customCode": "any additional code as a properly escaped string"
}

Only include the properties that need to change based on the user's query.
No extra text. No code fences. No comments.
`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_KEY_OPENAI}`,
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

    // 1) Get the text from the model's reply
    let rawContent = responseData.choices[0].message.content || "";

    // 2) Strip out any triple-backtick fences
    rawContent = rawContent
      .replace(/```json/gi, "")   // remove ```json (case-insensitive)
      .replace(/```/g, "")        // remove ```

    // 3) Strip out any single-line JS comments if they appear
    //    (If the LLM sneaks them in, they'd break JSON.parse.)
    rawContent = rawContent.replace(/\/\/.*$/gm, "");

    // 4) Optionally remove multiline comments if the model somehow includes them
    rawContent = rawContent.replace(/\/\*[\s\S]*?\*\//g, "");

    // 5) Trim whitespace
    rawContent = rawContent.trim();

    // 6) Extract only the portion from the first '{' to the last '}' 
    //    in case there's extraneous text outside the JSON.
    const startIndex = rawContent.indexOf("{");
    const endIndex = rawContent.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      rawContent = rawContent.substring(startIndex, endIndex + 1);
    }

    // 7) Finally parse the cleaned string as JSON
    const sceneModifications = JSON.parse(rawContent);

    // 8) Return the JSON result
    res.status(200).json(sceneModifications);

  } catch (error) {
    console.error('Error processing OpenAI request:', error);
    return res.status(500).json({ error: 'Error processing OpenAI request' });
  }
}

export default allowCors(handler);
