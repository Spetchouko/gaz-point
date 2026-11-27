"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
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
import { toast } from "sonner";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPublicite() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/publicite/${id}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          credentials: "include",
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
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/publicite/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Échec de la modification");

      toast.success("Publicité modifiée avec succès !", {
        description: "Vos modifications ont bien été enregistrées.",
        icon: <CheckCircle className="size-5 text-green-600" />,
      });

      setTimeout(() => {
        router.push("/dashboard/admin/publicite");
        router.refresh();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la modification";
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
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}