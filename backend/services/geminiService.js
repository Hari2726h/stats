import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

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

export async function generateAccessibleTheme(colors) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackTheme();
  }

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Suggest accessible UI color combinations for a sports widget using these colors: ${colors.join(
    ", "
  )}. Ensure WCAG contrast compliance. Return JSON with keys primaryColor, secondaryColor, backgroundColor, all in hex format like #2563EB.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(clean);
    const validated = themeSchema.safeParse(parsed);
    if (!validated.success) {
      return fallbackTheme();
    }
    return validated.data;
  } catch {
    return fallbackTheme();
  }
}

export async function generateEmbedExamples(config) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      html: `<match-widget match-id=\"${config.matchId}\" theme=\"${config.theme}\"></match-widget>`,
      react: `<MatchWidget matchId=\"${config.matchId}\" theme=\"${config.theme}\" />`,
      wordpress: `[match_widget id=\"${config.matchId}\" theme=\"${config.theme}\"]`,
      nextjs: `import dynamic from \"next/dynamic\";\nconst MatchWidget = dynamic(() => import(\"@/components/MatchWidget\"), { ssr: false });\n<MatchWidget matchId=\"${config.matchId}\" theme=\"${config.theme}\" />;`,
    };
  }

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate integration examples for a sports match widget with matchId ${config.matchId} and theme ${config.theme}. Return strict JSON with keys html, react, wordpress, nextjs and code snippets as string values only.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(clean);
    return {
      html: String(parsed.html || ""),
      react: String(parsed.react || ""),
      wordpress: String(parsed.wordpress || ""),
      nextjs: String(parsed.nextjs || ""),
    };
  } catch {
    return {
      html: `<match-widget match-id=\"${config.matchId}\" theme=\"${config.theme}\"></match-widget>`,
      react: `<MatchWidget matchId=\"${config.matchId}\" theme=\"${config.theme}\" />`,
      wordpress: `[match_widget id=\"${config.matchId}\" theme=\"${config.theme}\"]`,
      nextjs: `import dynamic from \"next/dynamic\";\nconst MatchWidget = dynamic(() => import(\"@/components/MatchWidget\"), { ssr: false });\n<MatchWidget matchId=\"${config.matchId}\" theme=\"${config.theme}\" />;`,
    };
  }
}
