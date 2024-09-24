// lib/mongoose.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;


let isConnected = false;


export async function dbConnect() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Could not connect to MongoDB');
  }
};
