"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DataItem {
  name: string
  ocupacion: number
}

function colorPorOcupacion(v: number) {
  if (v >= 75) return "#A3FF12"
  if (v >= 40) return "#22d3ee"
  return "#748390"
}

const tickStyle = { fontSize: 11, fill: "rgba(255,255,255,0.35)" }

export function OcupacionChart({ data, maxDominio = 100 }: { data: DataItem[]; maxDominio?: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-white/25 text-center py-10">Sin datos para el período.</p>
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <XAxis
            dataKey="name"
            tick={{ ...tickStyle, fontSize: 11 }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis unit="%" domain={[0, maxDominio]} tick={tickStyle} width={40} />
          <Tooltip
            contentStyle={{ background: "rgba(12,14,20,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#F2F4F8" }}
            formatter={(v) => [`${v}%`, "Ocupación"]}
          />
          <Bar dataKey="ocupacion" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colorPorOcupacion(entry.ocupacion)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-white/30 mt-2 justify-end">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#A3FF12] inline-block" /> ≥ 75%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#22d3ee] inline-block" /> 40–74%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#748390] inline-block" /> &lt; 40%
        </span>
      </div>
    </>
  )
}
