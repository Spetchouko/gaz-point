"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminPageHeader } from "@/app/_components/dashboard/admin";
import { PubliciteForm } from "../PubliciteForm";
import { toast } from "sonner";

export default function AdminPubliciteNouvellePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/publicite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de la création");

      toast.success("Publicité enregistrée avec succès !", {
        description: "Votre annonce publicitaire a bien été enregistrée et est disponible dans votre liste de publicités.",
        icon: <CheckCircle className="size-5 text-green-600" />,
      });

      // Redirection après un court délai pour laisser le toast s'afficher
      setTimeout(() => {
        router.push("/dashboard/admin/publicite");
        router.refresh();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la création";
      toast.error(message, {
        icon: <AlertCircle className="size-5 text-red-600" />,
        description: "Veuillez vérifier les informations et réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/admin/publicite");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Nouvelle annonce publicitaire"
        subtitle="Renseignez les informations de l'annonce. L'image sera stockée dans Neon."
        icon={<span className="size-5">📢</span>}
        actions={
          <Link href="/dashboard/admin/publicite">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" /> Retour aux publicités
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Créer une annonce publicitaire</CardTitle>
          <CardDescription>
            Les champs marqués d'un * sont obligatoires. L'aperçu à droite se met à jour en temps réel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PubliciteForm
            isEditing={false}
            onSubmit={handleCreateSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}