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

export function withAuth(handler) {
  return async (req, res) => {
    // Get the token from cookie
    const token = getGoogleTokenFromCookie(req);
    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Decode token to extract user info (e.g., sub and email)
    const tokenData = getSubAndEmailFromToken(token);
    if (!tokenData) {
      console.error('Token structure:', JSON.stringify(token, null, 2));
      return res.status(400).json({ error: 'Failed to extract user information' });
    }

    // Attach the token data to the request object for further use in the endpoint
    req.user = tokenData;

    // Proceed to the original handler
    return handler(req, res);
  };
}

export const allowCors = fn => async (req, res) => {
  let allowedOrigins = [
    'https://calera.io',
    'https://www.calera.io'
  ];

  const isProd = process.env.VERCEL_ENV === 'production';

  if(!isProd) {
    allowedOrigins.push('http://localhost:5173')
  }

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
