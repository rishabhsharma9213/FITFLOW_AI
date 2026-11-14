const mongoose = require('mongoose');

// Cache the MongoDB connection across serverless invocations (Vercel) and local reloads
let cached = global._fitflowMongoCache;
if (!cached) {
  cached = global._fitflowMongoCache = { conn: null, promise: null, lastFailedAt: 0, lastError: null };
}

const FAILURE_COOLDOWN_MS = 30 * 1000; // 30s cooldown if Atlas IP whitelist blocks serverless IP

const connectDB = async () => {
  // 1. If already connected, reuse the active connection immediately
  if (mongoose.connection.readyState === 1 && cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.trim()) {
    throw new Error(
      'MONGODB_URI environment variable is not configured. Add MONGODB_URI in your Vercel Project Settings -> Environment Variables.'
    );
  }

  // 2. Avoid blocking every parallel API call for 2.5s if Atlas just rejected the IP
  if (cached.lastFailedAt && Date.now() - cached.lastFailedAt < FAILURE_COOLDOWN_MS) {
    throw cached.lastError || new Error('MongoDB connection in cooldown after recent failure.');
  }

  // 3. If a connection attempt is not already in flight, start one
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri.trim(), {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: process.env.VERCEL ? 2500 : 8000,
        socketTimeoutMS: 45000,
      })
      .then((connection) => {
        cached.lastFailedAt = 0;
        cached.lastError = null;
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        console.log(`Database Name: ${connection.connection.name}`);
        return connection;
      })
      .catch((error) => {
        cached.promise = null;
        cached.lastFailedAt = Date.now();
        cached.lastError = error;
        console.error('MongoDB connection failed:', error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
