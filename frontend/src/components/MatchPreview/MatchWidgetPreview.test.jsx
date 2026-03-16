import { render, screen } from "@testing-library/react";
import MatchWidgetPreview from "./MatchWidgetPreview";

describe("MatchWidgetPreview", () => {
  test("renders match data", () => {
    render(
      <MatchWidgetPreview
        matchId="12345"
        primaryColor="#2563EB"
        secondaryColor="#F8FAFC"
        accentColor="#1D4ED8"
        fontFamily="Manrope"
        theme="light"
        logo=""
        borderRadius={16}
        widgetSize="medium"
        previewDevice="desktop"
        matchData={{
          homeTeam: "Team A",
          awayTeam: "Team B",
          score: "2 - 1",
          stadium: "National Arena",
          matchDate: "2026-03-24T19:00:00Z",
        }}
      />
    );

    expect(screen.getByText("Team A")).toBeInTheDocument();
    expect(screen.getByText("Team B")).toBeInTheDocument();
    expect(screen.getByText("2 - 1")).toBeInTheDocument();
  });
});
