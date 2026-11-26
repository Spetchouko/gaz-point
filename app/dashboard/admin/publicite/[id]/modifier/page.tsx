"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminPageHeader } from "@/app/_components/dashboard/admin";
import { PubliciteForm } from "../../PubliciteForm";

interface PubliciteItem {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number | null;
  priceLabel: string | null;
  location: string | null;
  phone: string | null;
  linkUrl: string | null;
  slot: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  duration: number | null;
  priority: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPubliciteModifierPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [publicite, setPublicite] = useState<PubliciteItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPublicite() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/publicite/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Impossible de charger l'annonce");
        const data = await res.json();
        if (!cancelled) {
          setPublicite(data.publicite ?? data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger l'annonce");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPublicite();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleEditSubmit = async (values: any) => {
    try {
      const res = await fetch(`/api/admin/publicite/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description ?? null,
          image: values.image ?? null,
          linkUrl: values.linkUrl ?? null,
          slot: values.slot,
          status: values.status,
          startAt: values.startAt ?? null,
          endAt: values.endAt ?? null,
          duration: values.duration ?? null,
          priority: values.priority ?? null,
          displayOrder: values.displayOrder ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de la modification");
      router.push("/dashboard/admin/publicite");
      router.refresh();
    } catch (err) {
      throw err;
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/admin/publicite");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Modification..."
          subtitle="Chargement de l'annonce publicitaire"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-8 mx-auto animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !publicite) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Erreur"
          subtitle={error || "Annonce introuvable"}
        />
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">{error || "Annonce introuvable"}</p>
                <p className="text-sm text-muted-foreground mt-1">L'annonce a peut-être été supprimée ou n'existe pas.</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/admin/publicite">
                <Button variant="outline">
                  <ArrowLeft className="size-4 mr-2" /> Retour aux publicités
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Modifier l'annonce publicitaire"
        subtitle="Les changements sont immédiatement enregistrés en base."
        icon={<span className="size-5">✏️</span>}
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
          <CardTitle>Modifier l'annonce : {publicite.title}</CardTitle>
          <CardDescription>
            Les champs marqués d'un * sont obligatoires. L'aperçu à droite se met à jour en temps réel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PubliciteForm
            initialData={publicite}
            isEditing={true}
            onSubmit={handleEditSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}