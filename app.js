import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from './src/routes/auth-route.js'

import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use('/api/v1/auth', authRoutes)


app.get("/", (_, res) => {
  res.send("API is running...");
});

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on this PORT: ${PORT}`);
});
