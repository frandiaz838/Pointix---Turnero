"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DataItem {
  name: string
  ocupacion: number
}

// Mapea ocupación a un gradient id. Usamos 3 niveles para que sea
// rápido de leer pero con suficiente contraste.
function gradientPara(v: number): string {
  if (v >= 75) return "url(#barLimeCyanHigh)"
  if (v >= 40) return "url(#barLimeCyanMid)"
  return "url(#barLimeCyanLow)"
}

const tickStyle = { fontSize: 11, fill: "rgba(255,255,255,0.55)" }

export function OcupacionChart({ data, maxDominio = 100 }: { data: DataItem[]; maxDominio?: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-white/25 text-center py-10">Sin datos para el período.</p>
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          {/* Gradientes verticales (lime arriba → cyan abajo) por nivel */}
          <defs>
            <linearGradient id="barLimeCyanHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A3FF12" stopOpacity={1} />
              <stop offset="60%" stopColor="#A3FF12" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="barLimeCyanMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A3FF12" stopOpacity={0.85} />
              <stop offset="55%" stopColor="#5BE6B1" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="barLimeCyanLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A3FF12" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="name"
            tick={{ ...tickStyle, fontSize: 11 }}
            angle={-25}
            textAnchor="end"
            interval={0}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            unit="%"
            domain={[0, maxDominio]}
            tick={tickStyle}
            width={40}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(163,255,18,0.06)" }}
            contentStyle={{
              background: "rgba(12,14,20,0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(163,255,18,0.25)",
              borderRadius: "10px",
              padding: "10px 12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            labelStyle={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13px",
              marginBottom: "4px",
              letterSpacing: "0.01em",
            }}
            itemStyle={{
              color: "#A3FF12",
              fontWeight: 600,
              fontSize: "13px",
              padding: 0,
            }}
            formatter={(v) => [`${v}%`, "Ocupación"]}
          />
          <Bar dataKey="ocupacion" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={gradientPara(entry.ocupacion)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50 mt-3 justify-end">
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: "linear-gradient(180deg, #A3FF12 0%, #00E5FF 100%)" }}
          />
          Alta ≥ 75%
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: "linear-gradient(180deg, rgba(163,255,18,0.85) 0%, rgba(0,229,255,0.7) 100%)" }}
          />
          Media 40–74%
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm inline-block"
            style={{ background: "linear-gradient(180deg, rgba(163,255,18,0.55) 0%, rgba(0,229,255,0.4) 100%)" }}
          />
          Baja &lt; 40%
        </span>
      </div>
    </>
  )
}
