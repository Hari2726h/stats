import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const allowedTypes = ["image/png", "image/svg+xml", "image/jpeg", "image/jpg"];

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PNG, SVG, and JPG files are allowed."));
    }
    return cb(null, true);
  },
});

router.post("/upload", upload.single("logo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Logo upload failed." });
  }

  return res.json({
    message: "Logo uploaded successfully",
    fileName: req.file.filename,
    url: `/uploads/${req.file.filename}`,
  });
});

export default router;
