import { z } from "zod";

export const hexColorSchema = z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Invalid hex color");

export const configSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  fontFamily: z.enum(["Manrope", "Sora", "Poppins", "Montserrat"]),
  theme: z.enum(["light", "dark"]),
  borderRadius: z.number().min(4).max(28),
  widgetSize: z.enum(["small", "medium", "large"]),
  template: z.enum(["classic", "minimal", "broadcast"]),
  locale: z.enum(["en-US", "en-GB", "hi-IN"]),
  timezone: z.enum(["UTC", "Asia/Kolkata", "Europe/London", "America/New_York"]),
});
