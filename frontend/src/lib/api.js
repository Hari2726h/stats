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

export async function requestAITheme(colors) {
  const response = await fetch("/api/ai/theme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colors }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API unavailable");
  }
  return data.data;
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
