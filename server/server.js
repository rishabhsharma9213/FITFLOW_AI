const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'FitFlow AI backend is running!',
    service: 'FitFlow AI Analytics Engine',
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'fitflow_ai',
    },
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`FitFlow AI backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
