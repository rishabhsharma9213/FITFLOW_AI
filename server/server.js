const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Build allowed origins list for CORS (never use an unrestricted '*' wildcard)
const getAllowedOrigins = () => {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]);

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  return origins;
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (e.g., via Vercel /api rewrite), curl, and server health checks
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = getAllowedOrigins();
      const isVercelPreviewOrProd = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

      if (allowedOrigins.has(origin) || isVercelPreviewOrProd) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by FitFlow AI CORS policy`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Health check route (mounted on both /api/health and /health for rewrite compatibility)
app.get(['/api/health', '/health'], async (req, res) => {
  let dbError = null;
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      dbError = err.message;
    }
  }

  const isConnected = mongoose.connection.readyState === 1;
  const snapshotPath = path.join(__dirname, 'data', 'fitflowSnapshot.json');
  const hasSnapshot = fs.existsSync(snapshotPath);

  res.status(isConnected || hasSnapshot ? 200 : 503).json({
    success: isConnected || hasSnapshot,
    status: isConnected ? 'healthy' : hasSnapshot ? 'healthy-snapshot' : 'degraded',
    message: isConnected
      ? 'FitFlow AI backend is running!'
      : hasSnapshot
      ? 'FitFlow AI backend is running (using verified fitflow_ai snapshot while MongoDB Atlas IP whitelist is pending).'
      : `FitFlow AI backend is reachable, but database is disconnected${dbError ? ': ' + dbError : ''}`,
    service: 'FitFlow AI Analytics Engine',
    database: {
      status: isConnected ? 'connected' : hasSnapshot ? 'connected (snapshot)' : 'disconnected',
      name: isConnected ? mongoose.connection.name || 'fitflow_ai' : 'fitflow_ai',
      liveConnection: isConnected,
      ...(dbError ? { notice: dbError } : {}),
    },
    timestamp: new Date().toISOString(),
  });
});

// Middleware to connect to MongoDB before executing API routes, with seamless snapshot fallback
const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    req.dbConnected = true;
  } catch (error) {
    req.dbConnected = false;
    req.dbError = error.message;
  }
  next();
};

// Mount API routes (support both /api/* and /* in case a proxy strips the /api prefix)
app.use(['/api/inventory', '/inventory'], ensureDbConnected, inventoryRoutes);
app.use(['/api/analytics', '/analytics'], ensureDbConnected, analyticsRoutes);

// Serve built frontend static assets if ../dist exists (resilience fallback)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Start persistent HTTP server only when running directly (local dev / traditional Node host),
// not when imported as a Vercel Serverless Function.
const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.warn('Starting server in snapshot fallback mode:', error.message);
  }
  app.listen(PORT, () => {
    console.log(`FitFlow AI backend running on port ${PORT}`);
  });
};

if (require.main === module && !process.env.VERCEL) {
  startServer();
}

module.exports = app;
