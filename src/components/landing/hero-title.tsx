"use client"

import { useEffect, useState } from "react"

interface Props {
  text: string
  className?: string
}

export function HeroTitle({ text, className = "" }: Props) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const chars = text.split("")

  return (
    <h1
      className={`font-display font-black uppercase leading-[0.87] tracking-[-0.02em] text-white whitespace-nowrap ${className}`}
      aria-label={text}
    >
      {chars.map((char, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block"
          style={{
            opacity: started ? 1 : 0,
            transform: started ? "translateY(0)" : "translateY(28px)",
            transition: `opacity 0.5s ease ${i * 38}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 38}ms`,
            ...(char === " " ? { width: "0.25em" } : {}),
          }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </h1>
  )
}
