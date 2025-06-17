const express = require('express');
const cors = require('cors'); // ...new import...
const connectDB = require('./config/db');
const responseHelper = require('./utils/responseHelper.js');
const router = require('./routes/playersRoute.js');
const routeGuard = require('./middle_ware/routeGuard');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors()); // Allow calls from everywhere

// Routes
app.use('/api', router);
app.get('/apikey', (req, res) => {
  res.json({ apiKey: routeGuard.getApiKey() });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
