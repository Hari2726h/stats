import { motion } from "framer-motion";
import { Copy, Download, Loader2, Monitor, RotateCcw, Smartphone, Sparkles, Upload, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmbedCodeGenerator from "../../components/EmbedCodeGenerator/EmbedCodeGenerator";
import MatchWidgetPreview from "../../components/MatchPreview/MatchWidgetPreview";
import ThemeConfigurator from "../../components/ThemeConfigurator/ThemeConfigurator";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  fetchMatchById,
  requestAIAccessibilityFix,
  requestAIEmbedExamples,
  requestAIMatchInsights,
  requestAIPromptTheme,
  requestAITroubleshoot,
  uploadLogo,
} from "../../lib/api";

const defaultConfig = {
  matchId: "12345",
  primaryColor: "#2563EB",
  secondaryColor: "#F8FAFC",
  accentColor: "#1D4ED8",
  fontFamily: "Manrope",
  theme: "light",
  borderRadius: 16,
  widgetSize: "medium",
  template: "classic",
  locale: "en-US",
  timezone: "UTC",
  logo: "",
  logoFileName: "",
};

function hexToRgb(hex) {
  const parsed = hex.replace("#", "");
  const value = Number.parseInt(parsed, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance({ r, g, b }) {
  const channels = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(hexA, hexB) {
  const l1 = luminance(hexToRgb(hexA));
  const l2 = luminance(hexToRgb(hexB));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHex(r, g, b) {
  const toHex = (value) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

async function extractDominantColorsFromImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to process image"));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 64;
  canvas.height = 64;
  context.drawImage(image, 0, 0, 64, 64);

  const pixels = context.getImageData(0, 0, 64, 64).data;
  const buckets = new Map();

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 140) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const bright = (r + g + b) / 3;

    if (sat < 0.15 || bright < 25 || bright > 240) continue;

    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const key = `${qr},${qg},${qb}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const colors = sorted.slice(0, 5).map(([key]) => {
    const [r, g, b] = key.split(",").map(Number);
    return rgbToHex(r, g, b);
  });

  return colors;
}

function safeThemeFromPalette(palette, currentConfig) {
  const primary = palette[0] || currentConfig.primaryColor;
  const accent = palette[1] || currentConfig.accentColor;
  let secondary = currentConfig.theme === "dark" ? "#0F172A" : "#F8FAFC";

  if (contrastRatio(primary, secondary) < 4.5) {
    secondary = contrastRatio(primary, "#FFFFFF") > contrastRatio(primary, "#0F172A") ? "#FFFFFF" : "#0F172A";
  }

  return {
    primaryColor: primary,
    accentColor: accent,
    secondaryColor: secondary,
  };
}

export default function EmbedConfigurePage() {
  const [config, setConfig] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("config");

    if (!encoded) return defaultConfig;

    try {
      return { ...defaultConfig, ...JSON.parse(atob(encoded)) };
    } catch {
      return defaultConfig;
    }
  });
  const [matchData, setMatchData] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [aiExamples, setAiExamples] = useState(null);
  const [aiExamplesError, setAiExamplesError] = useState("");
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState("");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [savedPresets, setSavedPresets] = useState([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [autoThemeLoading, setAutoThemeLoading] = useState(false);
  const [previousTheme, setPreviousTheme] = useState(null);
  const [promptInput, setPromptInput] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [a11yFixLoading, setA11yFixLoading] = useState(false);
  const [a11yFixStatus, setA11yFixStatus] = useState("");
  const [troubleshootInput, setTroubleshootInput] = useState("");
  const [troubleshootPlatform, setTroubleshootPlatform] = useState("react");
  const [troubleshootLoading, setTroubleshootLoading] = useState(false);
  const [troubleshootError, setTroubleshootError] = useState("");
  const [troubleshootResult, setTroubleshootResult] = useState(null);

  useEffect(() => {
    loadMatch(config.matchId || defaultConfig.matchId);
    const stored = localStorage.getItem("match-widget-presets");
    if (stored) {
      setSavedPresets(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", config.theme === "dark");
  }, [config.theme]);

  const loadMatch = async (id) => {
    setLoadingMatch(true);
    setMatchError("");
    try {
      const data = await fetchMatchById(id);
      setMatchData(data);
      setConfig((previous) => ({ ...previous, matchId: id }));
    } catch (error) {
      setMatchError(error.message || "API unavailable");
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleLogoSelect = async (file, errorMessage) => {
    setLogoError(errorMessage || "");
    if (!file) return;

    try {
      setAutoThemeLoading(true);
      const uploaded = await uploadLogo(file);
      const palette = await extractDominantColorsFromImage(file);
      setConfig((previous) => {
        setPreviousTheme({
          primaryColor: previous.primaryColor,
          secondaryColor: previous.secondaryColor,
          accentColor: previous.accentColor,
        });

        return {
        ...previous,
        logo: uploaded.url,
        logoFileName: uploaded.fileName,
          ...safeThemeFromPalette(palette, previous),
        };
      });
    } catch (error) {
      setLogoError(error.message || "Logo upload error");
    } finally {
      setAutoThemeLoading(false);
    }
  };

  const undoAutoTheme = () => {
    if (!previousTheme) return;
    setConfig((previous) => ({ ...previous, ...previousTheme }));
    setPreviousTheme(null);
  };

  const generateIntegrationExamples = async () => {
    setAiExamplesError("");
    try {
      const examples = await requestAIEmbedExamples(config.matchId, config.theme);
      setAiExamples(examples);
    } catch (error) {
      setAiExamplesError(error.message || "API unavailable");
    }
  };

  const generateMatchInsights = async () => {
    if (!matchData) {
      setAiInsightsError("Load a valid match first.");
      return;
    }

    setAiInsightsLoading(true);
    setAiInsightsError("");

    try {
      const insights = await requestAIMatchInsights({
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        score: matchData.score,
        stadium: matchData.stadium,
        matchDate: String(matchData.matchDate),
      });
      setAiInsights(insights);
    } catch (error) {
      setAiInsightsError(error.message || "API unavailable");
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const savePreset = () => {
    const next = [...savedPresets, { ...config, id: Date.now() }].slice(-5);
    setSavedPresets(next);
    localStorage.setItem("match-widget-presets", JSON.stringify(next));
  };

  const exportConfiguration = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "match-widget-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importConfiguration = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setConfig((previous) => ({ ...previous, ...parsed }));
      setMatchError("");
    } catch {
      setMatchError("Invalid config file.");
    }
  };

  const copyShareLink = async () => {
    const encoded = btoa(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1200);
  };

  const generateThemeFromPrompt = async () => {
    const prompt = promptInput.trim();
    if (!prompt) {
      setPromptError("Describe the style you want first.");
      return;
    }

    setPromptLoading(true);
    setPromptError("");

    try {
      const nextTheme = await requestAIPromptTheme(prompt, {
        primaryColor: config.primaryColor || defaultConfig.primaryColor,
        secondaryColor: config.secondaryColor || defaultConfig.secondaryColor,
        accentColor: config.accentColor || defaultConfig.accentColor,
        fontFamily: config.fontFamily || defaultConfig.fontFamily,
        theme: config.theme || defaultConfig.theme,
        template: config.template || defaultConfig.template,
      });

      setConfig((previous) => ({ ...previous, ...nextTheme }));
    } catch (error) {
      setPromptError(error.message || "API unavailable");
    } finally {
      setPromptLoading(false);
    }
  };

  const applyA11yFix = async () => {
    setA11yFixLoading(true);
    setA11yFixStatus("");
    try {
      const fixed = await requestAIAccessibilityFix({
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        theme: config.theme,
      });
      setConfig((previous) => ({ ...previous, ...fixed }));
      setA11yFixStatus("Applied accessible color recommendations.");
    } catch (error) {
      setA11yFixStatus(error.message || "API unavailable");
    } finally {
      setA11yFixLoading(false);
    }
  };

  const runTroubleshoot = async () => {
    const issue = troubleshootInput.trim();
    if (!issue) {
      setTroubleshootError("Describe the issue first.");
      return;
    }

    setTroubleshootLoading(true);
    setTroubleshootError("");

    try {
      const result = await requestAITroubleshoot(issue, troubleshootPlatform);
      setTroubleshootResult(result);
    } catch (error) {
      setTroubleshootError(error.message || "API unavailable");
    } finally {
      setTroubleshootLoading(false);
    }
  };

  const sortedPresets = useMemo(() => [...savedPresets].reverse(), [savedPresets]);
  const contrast = useMemo(
    () => contrastRatio(config.primaryColor, config.secondaryColor),
    [config.primaryColor, config.secondaryColor]
  );
  const contrastPass = contrast >= 4.5;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-white/40 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-2xl"
      >
        <p className="text-sm uppercase tracking-[0.22em] text-blue-100">Sports Widget Studio</p>
        <h1 className="font-display text-3xl font-bold">Match Widget Embed Configurator</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-50">
          Configure your match widget, preview live in real-time, and ship secure embed snippets for any platform.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ThemeConfigurator
            config={config}
            onConfigChange={setConfig}
            onMatchLoad={loadMatch}
            loadingMatch={loadingMatch}
            error={matchError}
            onLogoSelect={handleLogoSelect}
            logoError={logoError}
            onSavePreset={savePreset}
          />

          <Card className="glass">
            <CardHeader>
              <CardTitle>Auto Theme From Uploaded Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Uploading a logo automatically extracts dominant colors and applies a contrast-safe theme to the live preview.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={undoAutoTheme} disabled={!previousTheme || autoThemeLoading}>
                  {autoThemeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                  Undo Auto Theme
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Project Utilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copyShareLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  {shareCopied ? "Link Copied" : "Copy Share Link"}
                </Button>
                <Button type="button" variant="outline" onClick={exportConfiguration}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Config
                </Button>
                <label className="inline-flex">
                  <input type="file" accept="application/json" className="hidden" onChange={importConfiguration} />
                  <span className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Config
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <EmbedCodeGenerator
            config={config}
            onGenerateExamples={generateIntegrationExamples}
            examples={aiExamples}
            examplesError={aiExamplesError}
          />
        </div>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Live Widget Preview</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={previewDevice === "desktop" ? "default" : "outline"}
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="mr-1 h-4 w-4" /> Desktop
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewDevice === "mobile" ? "default" : "outline"}
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="mr-1 h-4 w-4" /> Mobile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MatchWidgetPreview
                matchId={config.matchId}
                primaryColor={config.primaryColor}
                secondaryColor={config.secondaryColor}
                accentColor={config.accentColor}
                fontFamily={config.fontFamily}
                theme={config.theme}
                logo={config.logo}
                borderRadius={config.borderRadius}
                widgetSize={config.widgetSize}
                template={config.template}
                locale={config.locale}
                timezone={config.timezone}
                matchData={matchData}
                previewDevice={previewDevice}
              />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Accessibility Checker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Primary vs Secondary contrast ratio: <span className="font-semibold">{contrast.toFixed(2)}:1</span>
              </p>
              <p className={`text-sm font-medium ${contrastPass ? "text-emerald-600" : "text-amber-500"}`}>
                {contrastPass ? "WCAG AA contrast looks good." : "Contrast is low. Try darker primary or lighter secondary."}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={applyA11yFix} disabled={a11yFixLoading}>
                {a11yFixLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                AI Auto-Fix Colors
              </Button>
              {a11yFixStatus ? <p className="text-xs text-slate-500 dark:text-slate-300">{a11yFixStatus}</p> : null}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Saved Theme Presets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedPresets.length ? (
                sortedPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setConfig({ ...defaultConfig, ...preset })}
                    className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <span>{preset.matchId}</span>
                    <span className="flex gap-1">
                      <span className="h-4 w-4 rounded-full" style={{ background: preset.primaryColor }} />
                      <span className="h-4 w-4 rounded-full" style={{ background: preset.secondaryColor }} />
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">No presets saved yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>AI Match Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" onClick={generateMatchInsights} disabled={aiInsightsLoading}>
                {aiInsightsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate AI Insights
              </Button>
              {aiInsightsError ? <p className="text-sm text-red-500">{aiInsightsError}</p> : null}
              {aiInsights ? (
                <div className="space-y-2 rounded-xl border border-border/70 bg-background/60 p-3">
                  <p className="text-sm font-semibold">{aiInsights.headline}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{aiInsights.summary}</p>
                  <p className="text-sm font-medium text-primary">{aiInsights.cta}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">Generate short AI copy for this match widget.</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>AI Prompt-to-Theme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={promptInput}
                onChange={(event) => setPromptInput(event.target.value)}
                placeholder="Example: Premium dark sports dashboard with bold contrast and clean typography"
                className="min-h-24 w-full rounded-xl border border-input bg-background/80 p-3 text-sm"
              />
              <Button type="button" onClick={generateThemeFromPrompt} disabled={promptLoading}>
                {promptLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Theme From Prompt
              </Button>
              {promptError ? <p className="text-sm text-red-500">{promptError}</p> : null}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>AI Integration Troubleshooter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={troubleshootInput}
                onChange={(event) => setTroubleshootInput(event.target.value)}
                placeholder="Paste your error message or describe your integration issue"
                className="min-h-24 w-full rounded-xl border border-input bg-background/80 p-3 text-sm"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={troubleshootPlatform}
                  onChange={(event) => setTroubleshootPlatform(event.target.value)}
                  className="h-10 rounded-xl border border-input bg-background/80 px-3 text-sm"
                >
                  <option value="react">React</option>
                  <option value="html">HTML</option>
                  <option value="wordpress">WordPress</option>
                  <option value="nextjs">Next.js</option>
                  <option value="other">Other</option>
                </select>
                <Button type="button" onClick={runTroubleshoot} disabled={troubleshootLoading}>
                  {troubleshootLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Diagnose Issue
                </Button>
              </div>
              {troubleshootError ? <p className="text-sm text-red-500">{troubleshootError}</p> : null}
              {troubleshootResult ? (
                <div className="space-y-2 rounded-xl border border-border/70 bg-background/60 p-3">
                  <p className="text-sm font-semibold">{troubleshootResult.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{troubleshootResult.probableCause}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">
                    {troubleshootResult.fixSteps.map((step, index) => (
                      <li key={`fix-${index}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
