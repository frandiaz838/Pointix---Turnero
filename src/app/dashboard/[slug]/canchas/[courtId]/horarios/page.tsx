import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ slug: string; courtId: string }>
}

// La edición se unificó en una sola página con tabs.
export default async function HorariosRedirect({ params }: Props) {
  const { slug, courtId } = await params
  redirect(`/dashboard/${slug}/canchas/${courtId}?tab=horarios`)
}
