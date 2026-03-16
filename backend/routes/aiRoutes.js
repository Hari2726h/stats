import express from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { generateAccessibleTheme, generateEmbedExamples, generateMatchInsights } from "../services/geminiService.js";

const router = express.Router();

const themeRequestSchema = z.object({
  colors: z.array(z.string().regex(/^#([A-Fa-f0-9]{6})$/)).min(1),
});

const embedExampleSchema = z.object({
  matchId: z.string().trim().min(1).max(20),
  theme: z.enum(["light", "dark"]),
});

const matchInsightsSchema = z.object({
  homeTeam: z.string().trim().min(1).max(80),
  awayTeam: z.string().trim().min(1).max(80),
  score: z.string().trim().min(1).max(20),
  stadium: z.string().trim().min(1).max(120),
  matchDate: z.string().trim().min(1).max(80),
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
    console.error("AI theme generation failed:", error?.message || error);
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
    console.error("AI embed examples generation failed:", error?.message || error);
    return next({ status: 503, message: "AI service unavailable." });
  }
});

router.post("/match-insights", async (req, res, next) => {
  const parsed = matchInsightsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid match details." });
  }

  try {
    const cleaned = {
      homeTeam: sanitizeHtml(parsed.data.homeTeam, { allowedTags: [], allowedAttributes: {} }),
      awayTeam: sanitizeHtml(parsed.data.awayTeam, { allowedTags: [], allowedAttributes: {} }),
      score: sanitizeHtml(parsed.data.score, { allowedTags: [], allowedAttributes: {} }),
      stadium: sanitizeHtml(parsed.data.stadium, { allowedTags: [], allowedAttributes: {} }),
      matchDate: sanitizeHtml(parsed.data.matchDate, { allowedTags: [], allowedAttributes: {} }),
    };

    const result = await generateMatchInsights(cleaned);
    return res.json({ data: result });
  } catch (error) {
    console.error("AI match insights generation failed:", error?.message || error);
    return next({ status: 503, message: "AI service unavailable." });
  }
});

export default router;
