import express from "express";
import cors from "cors";
import morgan from "morgan";

import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();

// app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on this PORT: ${PORT}`);
});
