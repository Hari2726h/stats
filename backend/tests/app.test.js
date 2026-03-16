import request from "supertest";
import app from "../app.js";

describe("match routes", () => {
  test("valid match loads preview data", async () => {
    const response = await request(app).get("/api/match/12345");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("homeTeam");
  });

  test("invalid match shows error", async () => {
    const response = await request(app).get("/api/match/00000");
    expect(response.status).toBe(404);
    expect(response.body.error).toMatch(/Match not found/i);
  });
});

describe("ai routes", () => {
  test("theme generation returns valid hex colors", async () => {
    const response = await request(app)
      .post("/api/ai/theme")
      .send({ colors: ["#2563EB", "#FFFFFF"] });

    expect(response.status).toBe(200);
    expect(response.body.data.primaryColor).toMatch(/^#([A-Fa-f0-9]{6})$/);
    expect(response.body.data.secondaryColor).toMatch(/^#([A-Fa-f0-9]{6})$/);
    expect(response.body.data.backgroundColor).toMatch(/^#([A-Fa-f0-9]{6})$/);
  });
});
