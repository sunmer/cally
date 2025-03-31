import { getGoogleTokenFromCookie, allowCors, withAuth } from '../util.js';
import { query } from '../db.js';
import { Schedule, GOOGLE_OAUTH_PREFIX } from '../types.js';


async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(getEvent)(req, res);
  } else if (req.method === 'PUT') {
    return withAuth(updateEvent)(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

const getEvent = async (req, res) => {
  try {
    // Extract the schedule uuid and event id from request parameters.
    const { uuid, id } = req.query;
    if (!uuid || !id) {
      return res.status(400).json({ error: 'Missing schedule uuid or event id' });
    }
    // Query the schedule using the uuid and verify that it belongs to the authenticated user.
    const scheduleResult = await query(
      `SELECT 
        s.title, 
        s.events, 
        s.requires_additional_content AS "requiresAdditionalContent", 
        s.uuid, 
        s.created
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE s.uuid = $1 AND u.sub = $2`,
      [uuid, GOOGLE_OAUTH_PREFIX + req.user.sub]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found or not authorized' });
    }

    // Get the schedule (assuming uuid is unique).
    const schedule: Schedule = scheduleResult.rows[0];

    // Parse the event id as a number and filter the event from the events array.
    const eventId = parseInt(id, 10);
    const event = schedule.events.find(e => e.id === eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found in schedule' });
    }

    const requiresAdditionalContent = schedule.requiresAdditionalContent && !event?.content;

    return res.status(200).json({ event, requiresAdditionalContent });
  } catch (error) {
    console.error('Error processing event:', error);
    return res.status(500).json({ error: 'Failed to process event' });
  }
};

const updateEvent = async (req, res) => {
  try {
    // Extract the schedule uuid and event id from query parameters.
    const { uuid, id } = req.query;
    if (!uuid || !id) {
      return res.status(400).json({ error: 'Missing schedule uuid or event id' });
    }

    // Get the updated event data from the request body.
    const updatedEventData = req.body;
    if (!updatedEventData) {
      return res.status(400).json({ error: 'Missing event data in request body' });
    }

    // Query the schedule to verify ownership.
    const scheduleResult = await query(
      `SELECT events FROM schedules s
       JOIN users u ON s.user_id = u.id
       WHERE s.uuid = $1 AND u.sub = $2`,
      [uuid, GOOGLE_OAUTH_PREFIX + req.user.sub]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found or not authorized' });
    }

    // Get the current events array.
    let eventsArray = scheduleResult.rows[0].events;
    if (!Array.isArray(eventsArray)) {
      return res.status(500).json({ error: 'Schedule events data is corrupted' });
    }

    const eventId = parseInt(id, 10);
    // Find the event index in the events array.
    const eventIndex = eventsArray.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found in schedule' });
    }

    // Merge updated event data with existing event.
    const updatedEvent = {
      ...eventsArray[eventIndex],
      ...updatedEventData
    };

    // Replace the event in the events array.
    eventsArray[eventIndex] = updatedEvent;

    // Update the schedule's events in the database.
    await query(
      `UPDATE schedules SET events = $1 WHERE uuid = $2`,
      [JSON.stringify(eventsArray), uuid]
    );

    return res.status(200).json({ event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update event' });
  }
};

export default allowCors(handler);
