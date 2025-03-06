import express from "express";
import fs from "fs";
import path from "path";
import pool from "../db.js";
import { upload } from "../middleware.js";

const router = express.Router();

const deleteOldFile = (filePath) => {
  if (filePath) {
    try {
      fs.unlinkSync(`public${filePath}`);
    } catch (err) {
      console.warn(`Failed to delete old file (${filePath}):`, err.message);
    }
  }
};

router.get("/menu/food/info", async (req, res) => {
  try {
    const result = await pool.query("SELECT food_pdf FROM menus LIMIT 1");
    if (!result.rows.length || !result.rows[0].food_pdf) {
      return res.status(404).json({ error: "No Food PDF found" });
    }

    res.json({
      url: `/api/menu/food/download`,
      filename: path.basename(result.rows[0].food_pdf),
    });
  } catch (err) {
    console.error("Database Error (GET Food PDF Info):", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/menu/bar/info", async (req, res) => {
  try {
    const result = await pool.query("SELECT bar_pdf FROM menus LIMIT 1");
    if (!result.rows.length || !result.rows[0].bar_pdf) {
      return res.status(404).json({ error: "No Bar PDF found" });
    }

    res.json({
      url: `/api/menu/bar/download`,
      filename: path.basename(result.rows[0].bar_pdf),
    });
  } catch (err) {
    console.error("Database Error (GET Bar PDF Info):", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/menu/food/download", async (req, res) => {
  try {
    const result = await pool.query("SELECT food_pdf FROM menus LIMIT 1");
    if (!result.rows.length || !result.rows[0].food_pdf) {
      return res.status(404).json({ error: "No Food PDF found" });
    }

    const filePath = `public${result.rows[0].food_pdf}`;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "PDF file not found on server" });
    }

    const fileBuffer = fs.readFileSync(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(filePath)}"`
    );

    res.send(fileBuffer);
  } catch (err) {
    console.error("Error serving Food PDF:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/menu/bar/download", async (req, res) => {
  try {
    const result = await pool.query("SELECT bar_pdf FROM menus LIMIT 1");
    if (!result.rows.length || !result.rows[0].bar_pdf) {
      return res.status(404).json({ error: "No Bar PDF found" });
    }

    const filePath = `public${result.rows[0].bar_pdf}`;
    const filename = path.basename(filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "PDF file not found on server" });
    }

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error serving Bar PDF:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/menu/food", upload.single("foodPdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = `/uploads/${req.file.filename}`;

  try {
    await pool.query("BEGIN");

    const existing = await pool.query("SELECT food_pdf FROM menus LIMIT 1");
    if (existing.rows.length > 0) {
      deleteOldFile(existing.rows[0].food_pdf);
    }

    await pool.query(
      "INSERT INTO menus (id, food_pdf) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET food_pdf = EXCLUDED.food_pdf",
      [filePath]
    );

    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Food menu updated!",
      url: `/api/menu/food/download`,
      filename: req.file.filename,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Database Error (POST Food PDF):", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/menu/bar", upload.single("barPdf"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = `/uploads/${req.file.filename}`;

  try {
    await pool.query("BEGIN");
    const existing = await pool.query("SELECT bar_pdf FROM menus LIMIT 1");
    if (existing.rows.length > 0) {
      deleteOldFile(existing.rows[0].bar_pdf);
    }
    await pool.query(
      "INSERT INTO menus (id, bar_pdf) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET bar_pdf = EXCLUDED.bar_pdf",
      [filePath]
    );
    await pool.query("COMMIT");

    res.json({
      success: true,
      message: "Bar menu updated!",
      url: `/api/menu/bar/download`,
      filename: req.file.filename,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Database Error (POST Bar PDF):", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
