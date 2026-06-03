"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  formatAR?: boolean
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 900,
  className,
  formatAR = true,
}: Props) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * value))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  const display = formatAR ? count.toLocaleString("es-AR") : String(count)

  return (
    <span className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
