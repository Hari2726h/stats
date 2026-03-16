import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
].filter(Boolean);

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
});

function fallbackTheme() {
  return {
    primaryColor: "#2563EB",
    secondaryColor: "#E5E7EB",
    backgroundColor: "#0F172A",
  };
}

function fallbackEmbedExamples(config) {
  return {
    html: `<match-widget match-id="${config.matchId}" theme="${config.theme}"></match-widget>`,
    react: `<MatchWidget matchId="${config.matchId}" theme="${config.theme}" />`,
    wordpress: `[match_widget id="${config.matchId}" theme="${config.theme}"]`,
    nextjs: `import dynamic from "next/dynamic";\nconst MatchWidget = dynamic(() => import("@/components/MatchWidget"), { ssr: false });\n<MatchWidget matchId="${config.matchId}" theme="${config.theme}" />;`,
  };
}

function fallbackMatchInsights(match) {
  return {
    headline: `${match.homeTeam} vs ${match.awayTeam}: Matchday Spotlight`,
    summary: `Current score is ${match.score}. The game at ${match.stadium} is shaping up to be a close contest with strong momentum swings.`,
    cta: "Add this live widget to your site to keep fans updated in real time.",
  };
}

async function generateText(prompt) {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function generateAccessibleTheme(colors) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackTheme();
  }

  const prompt = `Suggest accessible UI color combinations for a sports widget using these colors: ${colors.join(
    ", "
  )}. Ensure WCAG contrast compliance. Return JSON with keys primaryColor, secondaryColor, backgroundColor, all in hex format like #2563EB.`;

  try {
    const text = await generateText(prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const validated = themeSchema.safeParse(parsed);

    if (!validated.success) {
      return fallbackTheme();
    }

    return validated.data;
  } catch (error) {
    console.error("Gemini theme fallback used:", error?.message || error);
    return fallbackTheme();
  }
}

export async function generateEmbedExamples(config) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackEmbedExamples(config);
  }

  const prompt = `Generate integration examples for a sports match widget with matchId ${config.matchId} and theme ${config.theme}. Return strict JSON with keys html, react, wordpress, nextjs and code snippets as string values only.`;

  try {
    const text = await generateText(prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      html: String(parsed.html || ""),
      react: String(parsed.react || ""),
      wordpress: String(parsed.wordpress || ""),
      nextjs: String(parsed.nextjs || ""),
    };
  } catch (error) {
    console.error("Gemini embed examples fallback used:", error?.message || error);
    return fallbackEmbedExamples(config);
  }
}

export async function generateMatchInsights(match) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackMatchInsights(match);
  }

  const prompt = `Create concise sports widget copy for this match: home team ${match.homeTeam}, away team ${match.awayTeam}, score ${match.score}, stadium ${match.stadium}, date ${match.matchDate}. Return strict JSON with keys headline, summary, cta. Keep it short and energetic.`;

  try {
    const text = await generateText(prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      headline: String(parsed.headline || ""),
      summary: String(parsed.summary || ""),
      cta: String(parsed.cta || ""),
    };
  } catch (error) {
    console.error("Gemini match insights fallback used:", error?.message || error);
    return fallbackMatchInsights(match);
  }
}
