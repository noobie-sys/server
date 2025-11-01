import redisClient from '../config/redis.js';

// Cache expiry times (in seconds)
export const CACHE_EXPIRY = {
  COURSE_BY_ID: 3600,      // 1 hour
  ALL_COURSES: 1800,       // 30 minutes
  SEARCH: 900,             // 15 minutes
};


export const getFromCache = async (key) => {
  try {
    if (!redisClient.isOpen) {
      return null;
    }

    const cachedData = await redisClient.get(key);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    return null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null; // Return null on error to allow fallback to DB
  }
};


export const setCache = async (key, data, expiry = null) => {
  try {
    if (!redisClient.isOpen) {
      return false;
    }

    const stringifiedData = JSON.stringify(data);
    
    if (expiry) {
      await redisClient.setEx(key, expiry, stringifiedData);
    } else {
      await redisClient.set(key, stringifiedData);
    }
    
    return true;
  } catch (error) {
    console.error('Cache set error:', error.message);
    return false; // Don't throw - caching is optional
  }
};