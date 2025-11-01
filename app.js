import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from './src/routes/auth-route.js'
import courseRoutes from './src/routes/course-route.js'

import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();

app.use(cors());

// Only parse JSON for non-file-upload routes
app.use((req, res, next) => {
  // Skip JSON parsing for multipart/form-data (file uploads)
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  express.json()(req, res, next);
});

app.use(morgan("dev"));

app.use('/api/auth', authRoutes)
app.use('/api/courses/', courseRoutes )


app.get("/", (_, res) => {
  res.status(200).json({
    message : "API is running...",
    data : {
      PORT : process.env.PORT
    }
  })
});

// connectDB();

app.listen(PORT, () => {
  console.log(`Server running on this PORT: ${PORT}`);
});
