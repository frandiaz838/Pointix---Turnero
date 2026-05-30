"use client"

import { Racquet, SoccerBall } from "@phosphor-icons/react"

export function SportIcon({ sport }: { sport: string }) {
  if (sport === "PADEL") return <Racquet size={32} className="text-blue-400" />
  return <SoccerBall size={32} className="text-green-400" />
}
