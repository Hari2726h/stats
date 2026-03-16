import express from "express";
import { z } from "zod";

const router = express.Router();

const matches = {
  "12345": {
    matchId: "12345",
    homeTeam: "Team A",
    awayTeam: "Team B",
    score: "2 - 1",
    stadium: "National Arena",
    matchDate: "2026-03-24T19:00:00Z",
  },
  "67890": {
    matchId: "67890",
    homeTeam: "City Lions",
    awayTeam: "River Eagles",
    score: "1 - 1",
    stadium: "Westfield Park",
    matchDate: "2026-03-30T17:30:00Z",
  },
};

const idSchema = z.string().trim().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/);

router.get("/:id", (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid match ID format." });
  }

  const match = matches[parsed.data];

  if (!match) {
    return res.status(404).json({ error: "Match not found. Please check the ID." });
  }

  return res.json({ data: match });
});

export default router;
