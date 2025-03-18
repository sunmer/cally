export const allowCors = fn => async (req, res) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://cally-chi.vercel.app'
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
