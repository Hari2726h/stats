import express from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { generateAccessibleTheme, generateEmbedExamples } from "../services/geminiService.js";

const router = express.Router();

const themeRequestSchema = z.object({
  colors: z.array(z.string().regex(/^#([A-Fa-f0-9]{6})$/)).min(1),
});

const embedExampleSchema = z.object({
  matchId: z.string().trim().min(1).max(20),
  theme: z.enum(["light", "dark"]),
});

router.post("/theme", async (req, res, next) => {
  const parsed = themeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid color input." });
  }

  try {
    const result = await generateAccessibleTheme(parsed.data.colors);
    return res.json({ data: result });
  } catch (error) {
    return next({ status: 503, message: "AI service unavailable." });
  }
});

router.post("/embed-examples", async (req, res, next) => {
  const parsed = embedExampleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request." });
  }

  try {
    const cleaned = {
      matchId: sanitizeHtml(parsed.data.matchId, { allowedTags: [], allowedAttributes: {} }),
      theme: parsed.data.theme,
    };
    const result = await generateEmbedExamples(cleaned);
    return res.json({ data: result });
  } catch (error) {
    return next({ status: 503, message: "AI service unavailable." });
  }
});

export default router;
