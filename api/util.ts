import jwt from 'jsonwebtoken';
import { GoogleTokenResponse } from './types';

export function getSubAndEmailFromToken(token) {
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

// Helper to extract token from cookie
export function getGoogleTokenFromCookie(req): GoogleTokenResponse | null {
  try {
    const tokenCookie = req.cookies?.['google_auth_token'];
    if (!tokenCookie) return null;

    return JSON.parse(tokenCookie);
  } catch (error) {
    console.error('Error parsing token from cookie:', error);
    return null;
  }
}

export const allowCors = fn => async (req, res) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://calera.io',
    'https://www.calera.io'
  ];

  // Get the origin of the incoming request
  const origin = req.headers.origin;

  // Check if the request's origin is in the list of allowed origins
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Enable credentials for cookies or tokens to be passed
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Allow all HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  // Include Authorization in the list of allowed headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Call the function for non-OPTIONS requests
  return await fn(req, res);
};
