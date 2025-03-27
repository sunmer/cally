import { uuidv7 } from "uuidv7";
import { Schedule, GOOGLE_OAUTH_PREFIX } from '../types.js';
import { getGoogleTokenFromCookie } from '../util.js';
import { allowCors, getSubAndEmailFromToken } from '../util.js';
import { query } from '../db.js';


async function handler(req, res) {
  if(req.method === 'GET') {
    await getEvent(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

const getEvent = async (req, res) => {
  try {
    // Extract the schedule uuid and event id from request parameters.
    const { uuid, id } = req.params;
    if (!uuid || !id) {
      return res.status(400).json({ error: 'Missing schedule uuid or event id' });
    }

    // Query the schedule with the given uuid.
    const scheduleResult = await query(
      `SELECT title, events, uuid, created
       FROM schedules
       WHERE uuid = $1`,
      [uuid]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Get the schedule (assuming uuid is unique).
    const schedule = scheduleResult.rows[0];

    // Parse the event id as a number and find the event in the events array.
    const eventId = parseInt(id, 10);
    const event = schedule.events.find(e => e.id === eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found in schedule' });
    }

    // Return the found event.
    return res.status(200).json(event);
  } catch (error) {
    console.error('Error processing event:', error);
    return res.status(500).json({ error: 'Failed to process event' });
  }
};



export default allowCors(handler);
