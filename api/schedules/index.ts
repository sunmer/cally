import { uuidv7 } from "uuidv7";
import { Schedule, GOOGLE_OAUTH_PREFIX } from '../types.js';
import { getGoogleTokenFromCookie } from '../util.js';
import { allowCors, getSubAndEmailFromToken } from '../util.js';
import { query } from '../db.js';


async function handler(req, res) {
  if (req.method === 'POST') {
    await createSchedule(req, res);
  } else if(req.method === 'GET') {
    await getSchedulesByUser(req, res);
  } else if(req.method === 'DELETE') {
    await deleteSchedule(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

const createSchedule = async (req, res) => {
  try {
    // Expect the request body to conform to the Schedule type
    const schedule: Schedule = req.body;
    if (!schedule || !Array.isArray(schedule.events) || !schedule.title) {
      return res
        .status(400)
        .json({ error: "Missing required fields: 'events' array and 'title'" });
    }

    const token = getGoogleTokenFromCookie(req);
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
    const userResult = await query(
      `SELECT id FROM users WHERE sub = $1`,
      [GOOGLE_OAUTH_PREFIX + sub]
    );

    let userId;
    if (userResult.rowCount === 0) {
      const newUuidUser = uuidv7();
      const newUser = await query(
        `INSERT INTO users (sub, email, uuid) VALUES ($1, $2, $3) RETURNING id`,
        [GOOGLE_OAUTH_PREFIX + sub, email, newUuidUser]
      );
      console.log(`Created new user with sub: ${sub}`);
      userId = newUser.rows[0].id;
    } else {
      console.log(`User with sub: ${sub} already exists`);
      userId = userResult.rows[0].id;
    }

    const generateRandomId = () => {
      return [...crypto.getRandomValues(new Uint8Array(5))]
        .map(b => (b % 36).toString(36))
        .join('');
    };

    // Assign ids and googleIds to events
    const eventsWithIds = schedule.events.map((event, index) => ({
      ...event,
      id: index + 1,
      googleId: generateRandomId()
    }));

    const newUuidEvent = uuidv7();
    const insertScheduleResult = await query(
      `INSERT INTO schedules (events, title, user_id, uuid) VALUES ($1, $2, $3, $4) RETURNING uuid`,
      [JSON.stringify(eventsWithIds), schedule.title, userId, newUuidEvent]
    );

    console.log(`Inserted events for user_id: ${userId}`);

    // Return the full schedule object (omit schedule.id if needed)
    const createdSchedule = {
      ...schedule,
      uuid: insertScheduleResult.rows[0].uuid,
      events: eventsWithIds
    };

    return res.status(200).json(createdSchedule);
  } catch (error) {
    console.error('Error processing events:', error);
    return res.status(500).json({ error: 'Failed to process events' });
  }
};

const getSchedulesByUser = async (req, res) => {
  try {
    // Extract the token from the cookie and then the sub from the token
    const token = getGoogleTokenFromCookie(req);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tokenData = getSubAndEmailFromToken(token);
    if (!tokenData) {
      console.error('Token structure:', JSON.stringify(token, null, 2));
      return res.status(400).json({ error: 'Failed to extract user information' });
    }

    const { sub } = tokenData;

    const result = await query(
      `SELECT 
         s.title, 
         s.events, 
         s.requires_additional_content AS "requiresAdditionalContent", 
         s.uuid, 
         s.created
       FROM schedules s
       JOIN users u ON s.user_id = u.id
       WHERE u.sub = $1
       AND s.is_active = TRUE`,
      [GOOGLE_OAUTH_PREFIX + sub]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error processing events:', error);
    return res.status(500).json({ error: 'Failed to process events' });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    // Extract the schedule uuid from the request body.
    const { uuid } = req.body;
    if (!uuid) {
      return res.status(400).json({ error: 'Missing schedule uuid in request body' });
    }

    // Get the user's token and extract the sub.
    const token = getGoogleTokenFromCookie(req);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const tokenData = getSubAndEmailFromToken(token);
    if (!tokenData) {
      console.error('Token structure:', JSON.stringify(token, null, 2));
      return res.status(400).json({ error: 'Failed to extract user information' });
    }
    const { sub } = tokenData;

    // Verify that the schedule belongs to the authenticated user.
    const scheduleResult = await query(
      `SELECT s.id, s.uuid 
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE s.uuid = $1 AND u.sub = $2`,
      [uuid, GOOGLE_OAUTH_PREFIX + sub]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found or not authorized' });
    }

    // Use the verified schedule's id from the query result for deletion.
    const scheduleId = scheduleResult.rows[0].id;

    // Delete the schedule from the database.
    await query(`UPDATE schedules SET is_active = FALSE WHERE id = $1;`, [scheduleId]);

    return res.status(200).json();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
};



export default allowCors(handler);
