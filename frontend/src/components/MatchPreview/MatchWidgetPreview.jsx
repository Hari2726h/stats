import { motion } from "framer-motion";
import { Badge } from "../ui/badge";

const sizeMap = {
  small: "max-w-sm",
  medium: "max-w-md",
  large: "max-w-xl",
};

export default function MatchWidgetPreview({
  matchId,
  primaryColor,
  secondaryColor,
  accentColor,
  fontFamily,
  theme,
  logo,
  borderRadius,
  widgetSize,
  template,
  locale,
  timezone,
  matchData,
  previewDevice,
}) {
  const dark = theme === "dark";
  const templateClass =
    template === "minimal"
      ? "ring-1 ring-white/30"
      : template === "broadcast"
        ? "ring-2 ring-offset-2 ring-offset-transparent"
        : "";

  const formattedDate = matchData?.matchDate
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: timezone,
      }).format(new Date(matchData.matchDate))
    : "Mar 24, 2026";

  return (
    <div className={previewDevice === "mobile" ? "mx-auto w-[360px]" : "w-full"}>
      <motion.div
        key={`${primaryColor}-${secondaryColor}-${theme}-${previewDevice}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`mx-auto w-full ${sizeMap[widgetSize]} ${templateClass}`}
        style={{
          fontFamily,
          borderRadius: `${borderRadius}px`,
          background: dark
            ? `linear-gradient(145deg, ${secondaryColor}15 0%, #020617 100%)`
            : `linear-gradient(145deg, ${secondaryColor} 0%, #ffffff 100%)`,
          border: `1px solid ${primaryColor}55`,
          boxShadow: `0 18px 45px ${primaryColor}30`,
          color: dark ? "#E2E8F0" : "#0F172A",
          transform: template === "broadcast" ? "skewX(-1deg)" : "none",
        }}
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <Badge style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>Live Match</Badge>
            <span className="text-xs opacity-80">ID: {matchId || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">{matchData?.homeTeam || "Team A"}</p>
              <p className="text-xl font-bold">{matchData?.awayTeam || "Team B"}</p>
            </div>
            {logo ? (
              <img src={logo} alt="Uploaded team logo" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-lg text-lg font-bold"
                style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
              >
                MW
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-black/5 p-3 dark:bg-white/10">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">Score</p>
              <p className="text-2xl font-extrabold" style={{ color: primaryColor }}>
                {matchData?.score || "2 - 1"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">Stadium</p>
              <p className="text-sm font-semibold">{matchData?.stadium || "Main Stadium"}</p>
            </div>
          </div>
          <p className="text-sm opacity-80">Match Date: {formattedDate}</p>
        </div>
      </motion.div>
    </div>
  );
}
