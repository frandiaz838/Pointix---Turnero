import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ fecha?: string; deporte?: string }>
}

// /{slug}/reservar fue fusionada con /{slug}.
// Mantenemos esta ruta como redirect para no romper links viejos
// (Linktree, WhatsApp, etc) y preservamos los searchParams.
export default async function ReservarRedirectPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams

  const query = new URLSearchParams()
  if (sp.fecha) query.set("fecha", sp.fecha)
  if (sp.deporte) query.set("deporte", sp.deporte)
  const qs = query.toString()

  redirect(`/${slug}${qs ? `?${qs}` : ""}`)
}
