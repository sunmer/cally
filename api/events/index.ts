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

    // Query the schedule using the uuid and verify that it belongs to the authenticated user.
    const scheduleResult = await query(
      `SELECT 
        s.title, 
        s.events, 
        s.requires_additional_content AS requiresAdditionalContent, 
        s.uuid, 
        s.created
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE s.uuid = $1 AND u.sub = $2`,
      [uuid, sub]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found or not authorized' });
    }

    // Get the schedule (assuming uuid is unique).
    const schedule = scheduleResult.rows[0];

    // Parse the event id as a number and filter the event from the events array.
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
