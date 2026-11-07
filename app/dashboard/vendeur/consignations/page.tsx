import { redirect } from "next/navigation"

export default function ConsignationsRedirect() {
  redirect("/dashboard/vendeur/reservations")
}