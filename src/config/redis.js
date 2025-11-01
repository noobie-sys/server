import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client for Upstash
// Upstash provides Redis URL in format: redis://default:<password>@<host>:<port>
const redisClient = createClient({
  url: process.env.UPSTASH_REDIS_URL,
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('🔄 Connecting to Redis...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis connected');
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis connection established');
    }
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    // Don't exit process - allow app to run without Redis (graceful degradation)
  }
};

export default redisClient;