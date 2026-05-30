"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DataItem {
  name: string
  ocupacion: number
}

function colorPorOcupacion(v: number) {
  if (v >= 75) return "#22c55e"
  if (v >= 40) return "#60a5fa"
  return "#2563eb"
}

export function OcupacionChart({ data, maxDominio = 100 }: { data: DataItem[]; maxDominio?: number }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 text-center py-10">Sin datos para el período.</p>

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            angle={-25}
            textAnchor="end"
            interval={0}
          />
          <YAxis unit="%" domain={[0, maxDominio]} tick={{ fontSize: 11 }} width={40} />
          <Tooltip formatter={(v) => [`${v}%`, "Ocupación"]} />
          <Bar dataKey="ocupacion" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colorPorOcupacion(entry.ocupacion)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-gray-400 mt-1 justify-end">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#22c55e] inline-block" /> ≥ 75%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#60a5fa] inline-block" /> 40–74%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2563eb] inline-block" /> &lt; 40%</span>
      </div>
    </>
  )
}
