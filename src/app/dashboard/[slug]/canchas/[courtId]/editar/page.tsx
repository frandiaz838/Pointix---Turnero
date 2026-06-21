import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ slug: string; courtId: string }>
}

// La edición de cancha se unificó en una sola página con tabs.
// Mantenemos este path como redirect para no romper bookmarks viejos.
export default async function EditarRedirect({ params }: Props) {
  const { slug, courtId } = await params
  redirect(`/dashboard/${slug}/canchas/${courtId}`)
}
