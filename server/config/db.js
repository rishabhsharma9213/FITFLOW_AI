const mongoose = require('mongoose');

// Cache the MongoDB connection across serverless invocations (Vercel) and local reloads
let cached = global._fitflowMongoCache;
if (!cached) {
  cached = global._fitflowMongoCache = { conn: null, promise: null };
}

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

  // 2. If a connection attempt is not already in flight, start one
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri.trim(), {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      })
      .then((connection) => {
        console.log(`MongoDB Connected: ${connection.connection.host}`);
        console.log(`Database Name: ${connection.connection.name}`);
        return connection;
      })
      .catch((error) => {
        cached.promise = null;
        console.error('MongoDB connection failed:', error.message);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
