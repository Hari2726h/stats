import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const GEMINI_DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

function getModelCandidates() {
  const configuredModels = String(process.env.GEMINI_MODEL || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set([...configuredModels, ...GEMINI_DEFAULT_MODELS])];
}

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
});

const assistantSchema = z.object({
  answer: z.string().min(1),
  suggestedQuestions: z.array(z.string()).max(3),
});

const promptThemeSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  fontFamily: z.enum(["Manrope", "Sora", "Poppins", "Montserrat"]),
  theme: z.enum(["light", "dark"]),
  template: z.enum(["classic", "minimal", "broadcast"]),
});

const troubleshootSchema = z.object({
  title: z.string(),
  probableCause: z.string(),
  fixSteps: z.array(z.string()).min(1),
});

const KNOWLEDGE_BASE = [
  {
    q: "How do I start the app?",
    a: "Run npm run dev from project root, then open http://localhost:5173/embed/configure.",
  },
  {
    q: "Which match IDs are valid?",
    a: "Use demo IDs 12345 and 67890.",
  },
  {
    q: "How do I generate embed code?",
    a: "Configure the widget and use the Embed Code Generator panel to copy or download snippets.",
  },
  {
    q: "How do I use Gemini key safely?",
    a: "Store GEMINI_API_KEY in backend/.env only. The frontend should never contain the API key.",
  },
  {
    q: "Why might AI features fail?",
    a: "Common reasons are model quota limits, missing backend env key, or backend not running.",
  },
];

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

function fallbackAssistantAnswer(question) {
  const query = String(question || "").toLowerCase();
  const best = KNOWLEDGE_BASE.find((item) => item.q.toLowerCase().includes(query) || query.includes(item.q.toLowerCase().split(" ")[0]));
  return {
    answer:
      best?.a ||
      "You can configure theme, preview live, generate embed examples, and ask AI insights. For setup, run npm run dev and open /embed/configure.",
    suggestedQuestions: KNOWLEDGE_BASE.slice(0, 3).map((item) => item.q),
  };
}

function fallbackPromptTheme() {
  return {
    primaryColor: "#1D4ED8",
    secondaryColor: "#F8FAFC",
    accentColor: "#0EA5E9",
    fontFamily: "Manrope",
    theme: "light",
    template: "classic",
  };
}

function fallbackAccessibilityFix(currentConfig) {
  return {
    primaryColor: currentConfig.theme === "dark" ? "#93C5FD" : "#1D4ED8",
    secondaryColor: currentConfig.theme === "dark" ? "#0F172A" : "#FFFFFF",
    accentColor: currentConfig.accentColor || "#0EA5E9",
  };
}

function fallbackTroubleshoot(platform) {
  return {
    title: `Troubleshooting for ${platform || "embed integration"}`,
    probableCause: "Script URL or initialization attributes may be incorrect.",
    fixSteps: [
      "Verify the script src URL is correct and publicly accessible.",
      "Check match-id and theme attributes are set on the widget element.",
      "Open browser console and network tab to inspect 404/503 errors.",
    ],
  };
}

async function generateText(prompt) {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError;

  for (const modelName of getModelCandidates()) {
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

export async function generateAssistantAnswer(question) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackAssistantAnswer(question);
  }

  const prompt = `You are assistant for Match Widget Embed Configurator. Use this knowledge base: ${JSON.stringify(
    KNOWLEDGE_BASE
  )}. User question: ${question}. Return strict JSON with keys answer and suggestedQuestions (max 3). Keep answer concise and practical.`;

  try {
    const text = await generateText(prompt);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const validated = assistantSchema.safeParse(parsed);
    if (!validated.success) {
      return fallbackAssistantAnswer(question);
    }
    return validated.data;
  } catch (error) {
    console.error("Gemini assistant fallback used:", error?.message || error);
    return fallbackAssistantAnswer(question);
  }
}

export async function generatePromptTheme(prompt, currentConfig) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackPromptTheme();
  }

  const safeCurrent = JSON.stringify({
    primaryColor: currentConfig.primaryColor,
    secondaryColor: currentConfig.secondaryColor,
    accentColor: currentConfig.accentColor,
    fontFamily: currentConfig.fontFamily,
    theme: currentConfig.theme,
    template: currentConfig.template,
  });

  const instruction = `Generate a widget theme JSON for this request: ${prompt}. Current config: ${safeCurrent}. Return strict JSON with keys primaryColor, secondaryColor, accentColor, fontFamily, theme, template. Use only: fontFamily in [Manrope,Sora,Poppins,Montserrat], theme in [light,dark], template in [classic,minimal,broadcast].`;

  try {
    const text = await generateText(instruction);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const validated = promptThemeSchema.safeParse(parsed);
    if (!validated.success) {
      return fallbackPromptTheme();
    }
    return validated.data;
  } catch (error) {
    console.error("Gemini prompt-theme fallback used:", error?.message || error);
    return fallbackPromptTheme();
  }
}

export async function generateAccessibilityFix(currentConfig) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackAccessibilityFix(currentConfig);
  }

  const instruction = `Given this widget config ${JSON.stringify(
    currentConfig
  )}, suggest accessible colors with better contrast. Return strict JSON with keys primaryColor, secondaryColor, accentColor in valid hex.`;

  try {
    const text = await generateText(instruction);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const validated = z
      .object({
        primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
        secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
        accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
      })
      .safeParse(parsed);

    if (!validated.success) {
      return fallbackAccessibilityFix(currentConfig);
    }
    return validated.data;
  } catch (error) {
    console.error("Gemini accessibility-fix fallback used:", error?.message || error);
    return fallbackAccessibilityFix(currentConfig);
  }
}

export async function generateTroubleshooting(issue, platform) {
  if (!process.env.GEMINI_API_KEY) {
    return fallbackTroubleshoot(platform);
  }

  const instruction = `Troubleshoot this widget integration issue for platform ${platform}: ${issue}. Return strict JSON with keys title, probableCause, fixSteps (array of short steps).`;

  try {
    const text = await generateText(instruction);
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    const validated = troubleshootSchema.safeParse(parsed);
    if (!validated.success) {
      return fallbackTroubleshoot(platform);
    }
    return validated.data;
  } catch (error) {
    console.error("Gemini troubleshoot fallback used:", error?.message || error);
    return fallbackTroubleshoot(platform);
  }
}
