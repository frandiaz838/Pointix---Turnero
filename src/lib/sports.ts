export interface SportInfo {
  label: string
  emoji: string | null  // null = renderizar ícono SVG Racquet
  badgeClass: string
  badgeClassSolid: string  // versión sólida con fondo oscuro y texto blanco
  iconColor: string        // clase Tailwind para el color del SVG (solo deportes de raqueta)
}

export const SPORTS: Record<string, SportInfo> = {
  FUTBOL_5:  { label: "Fútbol 5",  emoji: "⚽", badgeClass: "bg-green-50 text-green-700 border-green-200",       badgeClassSolid: "bg-green-700 text-white border-green-700",      iconColor: "" },
  FUTBOL_7:  { label: "Fútbol 7",  emoji: "⚽", badgeClass: "bg-green-50 text-green-700 border-green-200",       badgeClassSolid: "bg-green-700 text-white border-green-700",      iconColor: "" },
  FUTBOL_11: { label: "Fútbol 11", emoji: "⚽", badgeClass: "bg-green-50 text-green-700 border-green-200",       badgeClassSolid: "bg-green-700 text-white border-green-700",      iconColor: "" },
  PADEL:     { label: "Pádel",     emoji: null,  badgeClass: "bg-blue-50 text-blue-700 border-blue-200",          badgeClassSolid: "bg-blue-700 text-white border-blue-700",        iconColor: "text-blue-400" },
  TENIS:     { label: "Tenis",     emoji: null,  badgeClass: "bg-blue-50 text-blue-700 border-blue-200",          badgeClassSolid: "bg-blue-700 text-white border-blue-700",        iconColor: "text-blue-400" },
  SQUASH:    { label: "Squash",    emoji: null,  badgeClass: "bg-blue-50 text-blue-700 border-blue-200",          badgeClassSolid: "bg-blue-700 text-white border-blue-700",        iconColor: "text-blue-400" },
  BASQUET:   { label: "Básquet",   emoji: "🏀", badgeClass: "bg-orange-50 text-orange-700 border-orange-200",    badgeClassSolid: "bg-orange-600 text-white border-orange-600",    iconColor: "" },
  VOLEY:     { label: "Vóley",     emoji: "🏐", badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200",    badgeClassSolid: "bg-yellow-600 text-white border-yellow-600",    iconColor: "" },
  HOCKEY:    { label: "Hockey",    emoji: "🏑", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", badgeClassSolid: "bg-emerald-700 text-white border-emerald-700",  iconColor: "" },
  NATACION:  { label: "Natación",  emoji: "🏊", badgeClass: "bg-sky-50 text-sky-700 border-sky-200",              badgeClassSolid: "bg-sky-600 text-white border-sky-600",          iconColor: "" },
  // Valor heredado — se mantiene para registros existentes en la DB
  FOOTBALL:  { label: "Fútbol",    emoji: "⚽", badgeClass: "bg-green-50 text-green-700 border-green-200",       badgeClassSolid: "bg-green-700 text-white border-green-700",      iconColor: "" },
}

const FALLBACK: SportInfo = {
  label: "Deporte",
  emoji: "🏅",
  badgeClass: "bg-gray-50 text-gray-600 border-gray-200",
  badgeClassSolid: "bg-gray-600 text-white border-gray-600",
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
