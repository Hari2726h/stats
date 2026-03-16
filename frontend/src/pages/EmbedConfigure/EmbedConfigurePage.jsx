import { motion } from "framer-motion";
import { Loader2, Monitor, Smartphone, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmbedCodeGenerator from "../../components/EmbedCodeGenerator/EmbedCodeGenerator";
import MatchWidgetPreview from "../../components/MatchPreview/MatchWidgetPreview";
import ThemeConfigurator from "../../components/ThemeConfigurator/ThemeConfigurator";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { fetchMatchById, requestAIEmbedExamples, requestAIMatchInsights, uploadLogo } from "../../lib/api";

const defaultConfig = {
  matchId: "12345",
  primaryColor: "#2563EB",
  secondaryColor: "#F8FAFC",
  accentColor: "#1D4ED8",
  fontFamily: "Manrope",
  theme: "light",
  borderRadius: 16,
  widgetSize: "medium",
  logo: "",
  logoFileName: "",
};

export default function EmbedConfigurePage() {
  const [config, setConfig] = useState(defaultConfig);
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

  useEffect(() => {
    loadMatch(defaultConfig.matchId);
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
      const uploaded = await uploadLogo(file);
      setConfig((previous) => ({
        ...previous,
        logo: uploaded.url,
        logoFileName: uploaded.fileName,
      }));
    } catch (error) {
      setLogoError(error.message || "Logo upload error");
    }
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

  const sortedPresets = useMemo(() => [...savedPresets].reverse(), [savedPresets]);

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
                matchData={matchData}
                previewDevice={previewDevice}
              />
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
                    onClick={() => setConfig(preset)}
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
        </div>
      </div>
    </div>
  );
}
