import { render, screen } from "@testing-library/react";
import EmbedCodeGenerator from "./EmbedCodeGenerator";

describe("EmbedCodeGenerator", () => {
  test("embed code updates dynamically with config", () => {
    render(
      <EmbedCodeGenerator
        config={{
          matchId: "12345",
          primaryColor: "#2563EB",
          secondaryColor: "#FFFFFF",
          accentColor: "#1D4ED8",
          fontFamily: "Manrope",
          theme: "dark",
          borderRadius: 16,
          widgetSize: "medium",
          logoFileName: "logo.png",
        }}
        onGenerateExamples={() => {}}
        examples={null}
        examplesError=""
      />
    );

    const area = screen.getByRole("textbox");
    expect(area.value).toContain('match-id="12345"');
    expect(area.value).toContain('theme="dark"');
  });
});
