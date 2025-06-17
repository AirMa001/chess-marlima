const crypto = require('crypto');

// Helper function to generate a new API key
function generateApiKey() {
  return crypto.randomBytes(16).toString('hex');
}

// Generate and store a new API key
let allowed_list = [];
const generatedKey = generateApiKey();
allowed_list.push(generatedKey);
console.log(`Generated API key: ${generatedKey}`); // Use this key for API access

const routeGuard = (req, res, next) => {
  // Read Authorization header and extract Bearer token
  const authHeader = req.headers.authorization || '';

  // Enforce that a Bearer token is provided
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(403).json({
      error: true,
      errorCode: 403,
      status: 'error',
      message: 'Access denied. Bearer token missing.',
    });
  }
  const token = authHeader.slice(7);

  // Check if the provided token is allowed
  if (allowed_list.includes(token)) {
    next(); // Proceed to the next middleware or route handler
  } else {
    res.status(403).json({
      error: true,
      errorCode: 403,
      status: 'error',
      message: 'Access denied. Invalid token.',
    });
  }
};

// Expose a helper to get the generated API key
routeGuard.getApiKey = () => generatedKey;

module.exports = routeGuard;