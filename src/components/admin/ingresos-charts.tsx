"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"

interface Props {
  porCancha: { name: string; total: number }[]
  porDeporte: { name: string; total: number }[]
}

const COLORES = ["#CAFF00", "#22d3ee", "#a78bfa", "#fb923c"]

export function IngresosCharts({ porCancha, porDeporte }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const yAxisWidth = isMobile ? 90 : 120
  const barRightMargin = isMobile ? 48 : 60

  const tickStyle = { fontSize: isMobile ? 10 : 11, fill: "rgba(255,255,255,0.35)" }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Barras horizontales por cancha */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] mb-4">
          Por cancha
        </p>
        {porCancha.length === 0 ? (
          <p className="text-sm text-white/25 text-center py-8">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(porCancha.length * 48, 80)}>
            <BarChart
              layout="vertical"
              data={porCancha}
              margin={{ left: 0, right: barRightMargin, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={tickStyle}
                width={yAxisWidth}
              />
              <Tooltip
                contentStyle={{ background: "rgba(12,14,20,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#F2F4F8" }}
                formatter={(v) => [`$${Number(v).toLocaleString("es-AR")}`, "Ingresos"]}
              />
              <Bar
                dataKey="total"
                fill="#CAFF00"
                radius={[0, 4, 4, 0]}
                label={{
                  position: "right",
                  formatter: (v: unknown) => `$${Number(v).toLocaleString("es-AR")}`,
                  fontSize: isMobile ? 10 : 11,
                  fill: "rgba(255,255,255,0.35)",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Donut por deporte */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] mb-4">
          Por deporte
        </p>
        {porDeporte.length === 0 ? (
          <p className="text-sm text-white/25 text-center py-8">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <PieChart>
              <Pie
                data={porDeporte}
                dataKey="total"
                nameKey="name"
                innerRadius={isMobile ? 45 : 55}
                outerRadius={isMobile ? 70 : 85}
                paddingAngle={3}
              >
                {porDeporte.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "rgba(12,14,20,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#F2F4F8" }}
                formatter={(v) => [`$${Number(v).toLocaleString("es-AR")}`, ""]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}
