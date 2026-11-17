import { redirect } from "next/navigation"

/**
 * Ancienne étape « configuration du profil vendeur ».
 *
 * Les informations du point de vente sont désormais saisies à l'inscription
 * puis finalisées depuis le dashboard vendeur. Ce chemin redirige simplement
 * pour ne pas casser les anciens liens (et éviter un doublon de parcours).
 */
export default function ConfigurationProfilVendeurPage() {
  redirect("/dashboard/vendeur")
}
