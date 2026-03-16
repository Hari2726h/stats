import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function EmbedCodeGenerator({ config, onGenerateExamples, examples, examplesError }) {
  const [copied, setCopied] = useState(false);

  const sanitized = useMemo(() => {
    const escapedMatchId = escapeAttribute(config.matchId || "");
    return `<match-widget\n  match-id=\"${escapedMatchId}\"\n  primary-color=\"${config.primaryColor}\"\n  secondary-color=\"${config.secondaryColor}\"\n  accent-color=\"${config.accentColor}\"\n  font-family=\"${config.fontFamily}\"\n  theme=\"${config.theme}\"\n  border-radius=\"${config.borderRadius}\"\n  size=\"${config.widgetSize}\"\n  logo=\"${config.logoFileName || ""}\">\n</match-widget>\n\n<script src=\"https://cdn.matchwidgets.com/widget.js\"></script>`;
  }, [config]);

  const reactExample = `<MatchWidget\n  matchId=\"${config.matchId}\"\n  primaryColor=\"${config.primaryColor}\"\n  theme=\"${config.theme}\"\n/>`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(sanitized);
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Embed Code Generator</CardTitle>
        <CardDescription>Generate secure, copy-ready widget snippets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea readOnly value={sanitized} className="font-mono text-xs" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={copyCode}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </Button>
          <Button type="button" variant="outline" onClick={() => downloadText("match-widget-embed.html", sanitized)}>
            <Download className="mr-2 h-4 w-4" />
            Download Code
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadText("MatchWidgetExample.jsx", reactExample)}
          >
            Download React Example
          </Button>
          <Button type="button" variant="secondary" onClick={onGenerateExamples}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Integration Examples
          </Button>
        </div>
        <AnimatePresence>
          {copied ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm font-medium text-emerald-600"
            >
              Copied to clipboard.
            </motion.p>
          ) : null}
        </AnimatePresence>
        {examplesError ? <p className="text-sm text-red-500">{examplesError}</p> : null}
        {examples ? (
          <div className="grid gap-2 md:grid-cols-2">
            <Textarea readOnly value={examples.html} className="font-mono text-xs" />
            <Textarea readOnly value={examples.react} className="font-mono text-xs" />
            <Textarea readOnly value={examples.wordpress} className="font-mono text-xs" />
            <Textarea readOnly value={examples.nextjs} className="font-mono text-xs" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
