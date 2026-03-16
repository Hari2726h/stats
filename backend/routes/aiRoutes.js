import express from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import {
  generateAccessibleTheme,
  generateAccessibilityFix,
  generateAssistantAnswer,
  generateEmbedExamples,
  generateMatchInsights,
  generatePromptTheme,
  generateTroubleshooting,
} from "../services/geminiService.js";

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

const assistantSchema = z.object({
  question: z.string().trim().min(2).max(500),
});

const promptThemeSchema = z.object({
  prompt: z.string().trim().min(3).max(400),
  currentConfig: z.object({
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
    accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
    fontFamily: z.string().min(1).max(50).default("Manrope"),
    theme: z.enum(["light", "dark"]).default("light"),
    template: z.enum(["classic", "minimal", "broadcast"]).default("classic"),
  }),
});

const accessibilityFixSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  theme: z.enum(["light", "dark"]),
});

const troubleshootSchema = z.object({
  issue: z.string().trim().min(3).max(800),
  platform: z.enum(["html", "react", "wordpress", "nextjs", "other"]),
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

router.post("/assistant", async (req, res, next) => {
  const parsed = assistantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid question." });
  }

  try {
    const question = sanitizeHtml(parsed.data.question, { allowedTags: [], allowedAttributes: {} });
    const result = await generateAssistantAnswer(question);
    return res.json({ data: result });
  } catch (error) {
    console.error("AI assistant generation failed:", error?.message || error);
    return next({ status: 503, message: "AI service unavailable." });
  }
});

router.post("/prompt-theme", async (req, res, next) => {
  const parsed = promptThemeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid prompt payload." });
  }

  try {
    const prompt = sanitizeHtml(parsed.data.prompt, { allowedTags: [], allowedAttributes: {} });
    const result = await generatePromptTheme(prompt, parsed.data.currentConfig);
    return res.json({ data: result });
  } catch (error) {
    console.error("AI prompt-theme generation failed:", error?.message || error);
    return next({ status: 503, message: "AI service unavailable." });
  }
});

router.post("/accessibility-fix", async (req, res, next) => {
  const parsed = accessibilityFixSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid color payload." });
  }

  try {
    const result = await generateAccessibilityFix(parsed.data);
    return res.json({ data: result });
  } catch (error) {
    console.error("AI accessibility-fix generation failed:", error?.message || error);
    return next({ status: 503, message: "AI service unavailable." });
  }
});

router.post("/troubleshoot", async (req, res, next) => {
  const parsed = troubleshootSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid troubleshoot request." });
  }

  try {
    const issue = sanitizeHtml(parsed.data.issue, { allowedTags: [], allowedAttributes: {} });
    const result = await generateTroubleshooting(issue, parsed.data.platform);
    return res.json({ data: result });
  } catch (error) {
    console.error("AI troubleshoot generation failed:", error?.message || error);
    return next({ status: 503, message: "AI service unavailable." });
  }
});

export default router;
