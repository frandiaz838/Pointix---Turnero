"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"

interface Props {
  porCancha: { name: string; total: number }[]
  porDeporte: { name: string; total: number }[]
}

const COLORES = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6"]

export function IngresosCharts({ porCancha, porDeporte }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Barras horizontales por cancha */}
      <div className="bg-white border rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Por cancha</p>
        {porCancha.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(porCancha.length * 48, 80)}>
            <BarChart
              layout="vertical"
              data={porCancha}
              margin={{ left: 0, right: 60, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString("es-AR")}`, "Ingresos"]}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]}
                label={{
                  position: "right",
                  formatter: (v: number) => `$${v.toLocaleString("es-AR")}`,
                  fontSize: 11,
                  fill: "#6b7280",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Donut por deporte */}
      <div className="bg-white border rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Por deporte</p>
        {porDeporte.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={porDeporte}
                dataKey="total"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {porDeporte.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString("es-AR")}`, ""]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
