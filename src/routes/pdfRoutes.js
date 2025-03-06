import express from "express";
import pool from "../db.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/menu/food", upload.single("foodPdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileBuffer = req.file.buffer;

  try {
    await pool.query("BEGIN");

    await pool.query(
      `INSERT INTO Marieta_Menus (id, food_pdf) 
       VALUES (1, $1) 
       ON CONFLICT (id) DO UPDATE SET food_pdf = EXCLUDED.food_pdf`,
      [fileBuffer]
    );

    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Food menu PDF uploaded successfully!",
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Database Error (POST Food PDF):", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/menu/bar", upload.single("barPdf"), async (req, res) => {
  console.log("Received File:", req.file); // Debugging log

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileBuffer = req.file.buffer;
  console.log("File Buffer Size:", fileBuffer.length); // Log file size

  try {
    await pool.query("BEGIN");

    const result = await pool.query(
      `INSERT INTO Marieta_Menus (id, bar_pdf) 
       VALUES (1, $1) 
       ON CONFLICT (id) DO UPDATE SET bar_pdf = EXCLUDED.bar_pdf RETURNING *`,
      [fileBuffer]
    );

    await pool.query("COMMIT");

    console.log("Database Insert Result:", result.rows); // Log database result

    res.json({ success: true, message: "Bar menu PDF uploaded successfully!" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Database Error (POST Bar PDF):", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/menu/food/download", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT food_pdf FROM Marieta_Menus WHERE id = 1"
    );

    if (!result.rows.length || !result.rows[0].food_pdf) {
      return res.status(404).json({ error: "No Food PDF found" });
    }

    const pdfBuffer = result.rows[0].food_pdf;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=food_menu.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error serving Food PDF:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/menu/bar/download", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT bar_pdf FROM Marieta_Menus WHERE id = 1"
    );

    if (!result.rows.length || !result.rows[0].bar_pdf) {
      return res.status(404).json({ error: "No Bar PDF found" });
    }

    const pdfBuffer = result.rows[0].bar_pdf;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=bar_menu.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error serving Bar PDF:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/menu/check-pdfs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT food_pdf, bar_pdf FROM Marieta_Menus WHERE id = 1"
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "No record found for menus",
        foodPdf: false,
        barPdf: false,
      });
    }

    const { food_pdf, bar_pdf } = result.rows[0];

    res.json({
      foodPdf: !!food_pdf,
      barPdf: !!bar_pdf,
    });
  } catch (err) {
    console.error("Error checking PDF availability:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
