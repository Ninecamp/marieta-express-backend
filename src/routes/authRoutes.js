import express from "express";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/login", (req, res) => {
  const { password } = req.body;
  console.log(password);
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, message: "Login successful!" });
  } else {
    res.status(401).json({ success: false, message: "Invalid password" });
  }
});

export default router;
