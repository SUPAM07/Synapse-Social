import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  const mongoUri = env.mongoUri;
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(mongoUri, {
      dbName: mongoUri.split('/').pop(),
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}


