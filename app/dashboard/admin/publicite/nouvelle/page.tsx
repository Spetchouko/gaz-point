"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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

export default function AdminPubliciteNouvellePage() {
  const router = useRouter();

  const handleCreateSubmit = async (values: any) => {
    try {
      const res = await fetch("/api/admin/publicite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description ?? null,
          image: values.image ?? null,
          linkUrl: values.linkUrl ?? null,
          slot: values.slot,
          status: values.status,
          startAt: values.startAt ? values.startAt : null,
          endAt: values.endAt ? values.endAt : null,
          duration: values.duration ?? null,
          priority: values.priority ?? null,
          displayOrder: values.displayOrder ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de la création");
      router.push("/dashboard/admin/publicite");
      router.refresh();
    } catch (err) {
      throw err;
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
          />
        </CardContent>
      </Card>
    </div>
  );
}