import { render, screen, waitFor } from "@testing-library/react";
import EmbedConfigurePage from "./EmbedConfigurePage";

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (String(url).includes("/api/match/12345")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { homeTeam: "Team A", awayTeam: "Team B", score: "2 - 1" } }),
      });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: "Not found" }) });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EmbedConfigurePage", () => {
  test("loads with title", async () => {
    render(<EmbedConfigurePage />);

    await waitFor(() => {
      expect(screen.getByText(/Match Widget Embed Configurator/i)).toBeInTheDocument();
    });
  });
});
