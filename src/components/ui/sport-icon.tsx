"use client"

import { Racquet } from "@phosphor-icons/react"
import { getSport } from "@/lib/sports"

export function SportIcon({ sport, size = 32 }: { sport: string; size?: number }) {
  const info = getSport(sport)
  if (info.emoji === null) {
    return <Racquet size={size} className={info.iconColor} />
  }
  return <span style={{ fontSize: size, lineHeight: 1 }}>{info.emoji}</span>
}
