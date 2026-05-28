"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleCanchaActiva } from "@/actions/canchas"

interface Props {
  courtId: string
  isActive: boolean
  tenantId: string
  slug: string
}

export function ToggleActivaBtn({ courtId, isActive, tenantId, slug }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => toggleCanchaActiva(courtId, isActive, tenantId, slug))
  }

  return (
    <Button
      variant={isActive ? "destructive" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? "..." : isActive ? "Desactivar" : "Activar"}
    </Button>
  )
}
