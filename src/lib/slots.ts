export function generarSlots(openTime: string, closeTime: string, slotMinutes = 60): string[] {
  const [openH, openM] = openTime.split(":").map(Number)
  const [closeH, closeM] = closeTime.split(":").map(Number)

  const slots: string[] = []
  let minutes = openH * 60 + openM
  // "00:00" como cierre significa medianoche (fin del día = 1440 min)
  const end = closeH === 0 && closeM === 0 ? 24 * 60 : closeH * 60 + closeM

  while (minutes + slotMinutes <= end) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    minutes += slotMinutes
  }
  return slots
}
