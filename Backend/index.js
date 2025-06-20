require('dotenv').config();
const express = require('express');
const pool = require('./db'); // Import database connection pool
const authRoutes = require('./routes/auth'); // Import authentication routes
const productsRouter = require('./routes/products'); // Import product routes
const analyticsRoutes = require('./routes/analytics'); // Import the new router

const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const errorHandler = require('./middleware/error_handler');
const usersRoutes = require('./routes/users'); // <--- ADD THIS LINE

// Middleware to parse JSON body in requests
app.use(express.json());
app.use(cors());
app.use('/api/users', usersRoutes); // <--- ADD THIS LINE

// Mount authentication routes
app.use('/api/auth', authRoutes);

app.use('/api/analytics', analyticsRoutes); // Mount the new analytics router
// Mount product routes
app.use('/api/products', productsRouter);

// A simple test route to check server status
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});
// In your index.js or app.js:

// ... other app.use statements ...

app.use(errorHandler);

// Start server listening
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
process.on('unhandledRejection', (err, promise) => {
    console.error(`Logged Error: ${err.message}`);
    // Close server & exit process
    // This is optional; you might just want to log and keep the server running.
    // If you do this, make sure your app is robust to database connection drops.
    // server.close(() => process.exit(1));
});