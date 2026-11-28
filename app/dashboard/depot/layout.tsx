import { requireVendor } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DepotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireVendor()

  return children
}