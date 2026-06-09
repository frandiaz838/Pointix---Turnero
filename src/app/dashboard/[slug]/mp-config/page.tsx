import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function MpConfigRedirect({ params }: Props) {
  const { slug } = await params
  redirect(`/dashboard/${slug}/configuracion`)
}
