import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 5002;

app.use(express.json());

app.use(cors({ 
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/uploads", express.static("public/uploads"));

app.use("/api/admin", authRoutes);
app.use("/api", pdfRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
