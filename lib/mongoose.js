/**
 * Mongoose connection helper
 *
 * - Reads the MongoDB connection string from `process.env.MONGODB_URI` (or
 *   `NEXT_PUBLIC_MONGODB_URI` as a fallback).
 * - Caches the connection across module reloads (useful in development with
 *   Next.js hot reloading) to prevent creating multiple connections.
 * - Uses JSDoc types so editors (and TypeScript consumers) get proper types.
 *
 * Usage:
 *   import { connectToDatabase } from '@/lib/mongoose';
 *   const mongoose = await connectToDatabase();
 *
 * Notes:
 * - Do NOT hardcode credentials; set `MONGODB_URI` in your environment or
 *   `.env.local` file.
 * - The helper returns the connected Mongoose instance. If you just need the
 *   default connection, use `mongoose.connection` after calling this helper.
 */

/** @typedef {import('mongoose').Mongoose} Mongoose */
/** @typedef {import('mongoose').Connection} Connection */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
  // Throwing early helps developers notice misconfiguration during startup.
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Cache structure stored on `globalThis` to survive module reloads in dev.
 * @type {{ conn: Connection | null, promise: Promise<Mongoose> | null }}
 */
let cached = globalThis._mongoose;
if (!cached) {
  cached = globalThis._mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using mongoose and return the mongoose instance.
 * The connection is cached to avoid creating multiple connections during
 * development (Next.js hot reloads modules frequently).
 *
 * @returns {Promise<Mongoose>} The connected mongoose instance
 */
export async function connectToDatabase() {
  // Return the cached connection if it exists.
  if (cached.conn) {
    return cached.conn;
  }

  // If there's an in-flight connection attempt, wait for it instead of
  // creating a new one.
  if (!cached.promise) {
    const options = {
      // Mongoose maintains sensible defaults; these are harmless and can
      // improve stability in some environments.
      keepAlive: true,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
