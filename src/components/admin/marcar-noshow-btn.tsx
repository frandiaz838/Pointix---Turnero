"use client"

import { useTransition } from "react"
import { UserX } from "lucide-react"
import { marcarNoShow } from "@/actions/reservas"

export function MarcarNoShowBtn({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() => startTransition(() => marcarNoShow(bookingId))}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-white/45 hover:text-orange-400 transition-colors px-2.5 py-1 rounded-md hover:bg-orange-400/[0.08] disabled:opacity-40"
      title="El cliente confirmó pero no se presentó"
    >
      <UserX className="w-3 h-3" />
      {pending ? "..." : "No vino"}
    </button>
  )
}
