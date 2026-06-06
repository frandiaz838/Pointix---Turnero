export interface SportInfo {
  label: string
  emoji: string | null  // null = renderizar ícono SVG Racquet
  iconColor: string     // clase Tailwind para el color del SVG (solo deportes de raqueta)
}

export const SPORTS: Record<string, SportInfo> = {
  FUTBOL_5:  { label: "Fútbol 5",  emoji: "⚽", iconColor: "" },
  FUTBOL_7:  { label: "Fútbol 7",  emoji: "⚽", iconColor: "" },
  FUTBOL_11: { label: "Fútbol 11", emoji: "⚽", iconColor: "" },
  PADEL:     { label: "Pádel",     emoji: null, iconColor: "text-blue-400" },
  TENIS:     { label: "Tenis",     emoji: null, iconColor: "text-blue-400" },
  SQUASH:    { label: "Squash",    emoji: null, iconColor: "text-blue-400" },
  BASQUET:   { label: "Básquet",   emoji: "🏀", iconColor: "" },
  VOLEY:     { label: "Vóley",     emoji: "🏐", iconColor: "" },
  HOCKEY:    { label: "Hockey",    emoji: "🏑", iconColor: "" },
  NATACION:  { label: "Natación",  emoji: "🏊", iconColor: "" },
  // Valor heredado — se mantiene para registros existentes en la DB
  FOOTBALL:  { label: "Fútbol",    emoji: "⚽", iconColor: "" },
}

const FALLBACK: SportInfo = {
  label: "Deporte",
  emoji: "🏅",
  iconColor: "text-gray-400",
}

export function getSport(sport: string): SportInfo {
  return SPORTS[sport] ?? FALLBACK
}

export function sportLabel(sport: string): string {
  return getSport(sport).label
}

// Lista de deportes disponibles para crear nuevas canchas
export const SPORT_OPTIONS = [
  "FUTBOL_5",
  "FUTBOL_7",
  "FUTBOL_11",
  "PADEL",
  "TENIS",
  "SQUASH",
  "BASQUET",
  "VOLEY",
  "HOCKEY",
  "NATACION",
] as const
