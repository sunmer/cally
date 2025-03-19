import { uuidv7 } from "uuidv7";
import { CalendarSchedule } from '../types.js';
import { TokenResponse } from '../index.js';
import { allowCors } from '../util.js';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const GOOGLE_OAUTH_PREFIX = 'google';

// Helper to extract token from cookie
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

function getSubAndEmailFromToken(token) {
  if (token && token.id_token) {
    const decoded = jwt.decode(token.id_token);
    if (decoded && decoded.sub && decoded.email) {
      return { sub: decoded.sub, email: decoded.email };
    } else {
      console.error('Failed to extract sub from decoded id_token:', decoded);
      return null;
    }
  } else {
    console.error('id_token not found in token');
    return null;
  }
}

async function handler(req, res) {
  if (req.method === 'POST') {
    await createEvents(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

const createEvents = async (req, res) => {
  try {
    // Expect the request body to conform to the CalendarSchedule type
    const schedule: CalendarSchedule = req.body;
    if (!schedule || !Array.isArray(schedule.events) || !schedule.title) {
      return res
        .status(400)
        .json({ error: "Missing required fields: 'events' array and 'title'" });
    }

    // Extract the token from the cookie and then the sub from the token
    const token = getTokenFromCookie(req);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tokenData = getSubAndEmailFromToken(token);
    if (!tokenData) {
      console.error('Token structure:', JSON.stringify(token, null, 2));
      return res.status(400).json({ error: 'Failed to extract user information' });
    }

    const { sub, email } = tokenData;

    // Check if the user already exists
    const userResult = await query(`SELECT id FROM users WHERE sub = $1`, [sub]);

    let userId;
    if (userResult.rowCount === 0) {
      const newUuidUser = uuidv7();
      const newUser = await query(
        `INSERT INTO users (sub, email, uuid) VALUES ($1, $2, $3) RETURNING id`,
        [`${GOOGLE_OAUTH_PREFIX}:${sub}`, email, newUuidUser]
      );
      console.log(`Created new user with sub: ${sub}`);
      userId = newUser.rows[0].id;
    } else {
      console.log(`User with sub: ${sub} already exists`);
      userId = userResult.rows[0].id;
    }

    // Use userId in the events insertion query
    const newUuidEvent = uuidv7();
    await query(
      `INSERT INTO events (events, title, user_id, uuid) VALUES ($1, $2, $3, $4)`,
      [JSON.stringify(schedule.events), schedule.title, userId, newUuidEvent]
    );
    console.log(`Inserted events for user_id: ${userId}`);

    return res.status(200).json({ message: 'Event processed successfully' });
  } catch (error) {
    console.error('Error processing events:', error);
    return res.status(500).json({ error: 'Failed to process events' });
  }
};

export default allowCors(handler);
