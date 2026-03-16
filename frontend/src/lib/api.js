export async function fetchMatchById(id) {
  const response = await fetch(`/api/match/${encodeURIComponent(id)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
}

export async function uploadLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch("/api/logo/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Logo upload error");
  }
  return data;
}

export async function requestAIEmbedExamples(matchId, theme) {
  const response = await fetch("/api/ai/embed-examples", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId, theme }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
}

export async function requestAIMatchInsights(matchDetails) {
  const response = await fetch("/api/ai/match-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(matchDetails),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
}

export async function requestAIAssistant(question) {
  const response = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
}

export async function requestAIPromptTheme(prompt, currentConfig) {
  const response = await fetch("/api/ai/prompt-theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, currentConfig }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
}

export async function requestAIAccessibilityFix(payload) {
  const response = await fetch("/api/ai/accessibility-fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
}

export async function requestAITroubleshoot(issue, platform) {
  const response = await fetch("/api/ai/troubleshoot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issue, platform }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
}
