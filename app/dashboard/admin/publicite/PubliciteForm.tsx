"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronRight, Check, Loader2, Save, Eye, ExternalLink, Upload, X, Image as ImageIcon, Link as LinkIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PubliciteBannerCard, type PubliciteBannerData } from "@/app/_components/publicite-banner";
import {
  PUBLICITE_IMAGE_MAX_BYTES,
  PUBLICITE_ACCEPTED_MIME,
  PUBLICITE_ACCEPT_ATTRIBUTE,
  formatBytes,
} from "@/lib/publicite-config";

const slotSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(60),
  description: z.string().max(160).optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  linkUrl: z.string().optional().or(z.literal("")),
  slot: z.string(),
  status: z.enum(["draft", "scheduled", "active", "expired", "suspended"]),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  duration: z.number().int().min(5).max(30).optional().nullable(),
  priority: z.number().int().min(0).max(100).optional().nullable(),
  displayOrder: z.number().int().min(0).max(1000).optional().nullable(),
});

type SlotFormValues = z.infer<typeof slotSchema>;

interface PubliciteFormProps {
  initialData?: Partial<SlotFormValues> | null;
  isEditing?: boolean;
  onSubmit: (values: SlotFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const slotLabels: Record<string, string> = {
  home_hero: "Accueil — sous la bannière",
  home_search: "Accueil — au-dessus de « Trouver mon Gaz »",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Programmée",
  active: "En cours",
  expired: "Terminée",
  suspended: "Suspendue",
};

const steps = [
  { id: "content", label: "Contenu", icon: "FileText" },
  { id: "placement", label: "Placement", icon: "MapPin" },
  { id: "schedule", label: "Planification", icon: "Calendar" },
  { id: "advanced", label: "Avancé", icon: "Settings" },
] as const;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function validateFile(file: File): string | null {
  if (!PUBLICITE_ACCEPTED_MIME.includes(file.type)) {
    return `Format non pris en charge (${file.type}). Formats acceptés : JPG, PNG, WebP.`;
  }
  if (file.size > PUBLICITE_IMAGE_MAX_BYTES) {
    return `L'image dépasse la limite de 5 Mo (${formatBytes(file.size)}).`;
  }
  return null;
}

export function PubliciteForm({
  initialData,
  isEditing,
  onSubmit,
  onCancel,
  isSubmitting,
}: PubliciteFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [previewData, setPreviewData] = useState<PubliciteBannerData | null>(null);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasInitialImage, setHasInitialImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const form = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      title: "",
      description: "",
      image: "",
      linkUrl: "",
      slot: "home_hero",
      status: "draft",
      startAt: "",
      endAt: "",
      duration: 8,
      priority: 0,
      displayOrder: 0,
      ...initialData,
    },
  });

  // Initialize image preview from initialData
  const watchedImage = form.watch("image");
  useEffect(() => {
    if (initialData?.image) {
      setImagePreview(initialData.image);
      setHasInitialImage(true);
      // Detect if initial image is a data URL or URL to set correct tab
      if (initialData.image.startsWith("data:")) {
        setImageTab("upload");
      } else if (initialData.image.startsWith("http")) {
        setImageTab("url");
      }
    } else {
      setHasInitialImage(false);
      setImagePreview(null);
      setImageTab("upload");
    }
    setUploadedFile(null);
    setUploadError(null);
  }, [initialData?.image, isEditing]);

  // Update imagePreview when watchedImage changes (from URL tab)
  useEffect(() => {
    if (imageTab === "url" && watchedImage && !hasInitialImage) {
      setImagePreview(watchedImage);
    }
  }, [watchedImage, imageTab, hasInitialImage]);

  // Sync form image value with our state
  useEffect(() => {
    if (imageTab === "upload" && uploadedFile) {
      // File will be converted to data URL on submit
      form.setValue("image", "pending_upload", { shouldValidate: false });
    } else if (imageTab === "url") {
      form.setValue("image", watchedImage, { shouldValidate: false });
    } else if (hasInitialImage && !uploadedFile) {
      // Keep the initial image when no new file/url is provided
      form.setValue("image", initialData?.image || "", { shouldValidate: false });
    } else {
      form.setValue("image", "", { shouldValidate: false });
    }
  }, [imageTab, uploadedFile, watchedImage, form, hasInitialImage, initialData?.image]);

  // Mettre à jour l'aperçu en temps réel - watch specific fields to avoid infinite loop
  const watchedTitle = form.watch("title");
  const watchedDescription = form.watch("description");
  const watchedLinkUrl = form.watch("linkUrl");
  const watchedSlot = form.watch("slot");
  const watchedStatus = form.watch("status");
  const watchedStartAt = form.watch("startAt");
  const watchedEndAt = form.watch("endAt");
  const watchedDuration = form.watch("duration");
  const watchedPriority = form.watch("priority");
  const watchedDisplayOrder = form.watch("displayOrder");

  useEffect(() => {
    setPreviewData({
      id: initialData?.id || "preview",
      title: watchedTitle || "Titre de l'annonce",
      description: watchedDescription || null,
      image: imagePreview,
      price: null,
      priceLabel: null,
      location: null,
      phone: null,
      linkUrl: watchedLinkUrl || null,
      startAt: watchedStartAt || null,
      endAt: watchedEndAt || null,
      status: watchedStatus,
      duration: watchedDuration ?? 8000,
      priority: watchedPriority ?? 0,
      displayOrder: watchedDisplayOrder ?? 0,
    });
  }, [
    watchedTitle,
    watchedDescription,
    watchedLinkUrl,
    watchedSlot,
    watchedStatus,
    watchedStartAt,
    watchedEndAt,
    watchedDuration,
    watchedPriority,
    watchedDisplayOrder,
    imagePreview,
    initialData?.id,
  ]);

  const currentStep = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) setActiveStep((s) => s + 1);
  };

  const handleBack = () => {
    if (!isFirstStep) setActiveStep((s) => s - 1);
  };

  const handleFormSubmit = async (values: SlotFormValues) => {
    // If we have an uploaded file, convert to data URL before submitting
    if (uploadedFile) {
      try {
        const dataUrl = await fileToDataUrl(uploadedFile);
        onSubmit({ ...values, image: dataUrl });
      } catch {
        setUploadError("Erreur lors de la lecture du fichier");
      }
    } else {
      onSubmit(values);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null);
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadedFile(file);
    const dataUrl = await fileToDataUrl(file);
    setImagePreview(dataUrl);
    form.setValue("image", dataUrl, { shouldValidate: true });
  }, [form]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add("border-primary", "bg-primary/5");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-primary", "bg-primary/5");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-primary", "bg-primary/5");
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const removeImage = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setHasInitialImage(false);
    setImageTab("upload");
    form.setValue("image", "");
    setUploadError(null);
  };

  const handleUrlChange = (url: string) => {
    form.setValue("image", url, { shouldValidate: true });
    setUploadError(null);
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "content":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                placeholder="Ex: Promo gaz 12,5 kg"
                {...form.register("title")}
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Détails de l'offre..."
                {...form.register("description")}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Max 160 caractères</p>
            </div>
            <div>
              <Label>Image de la bannière *</Label>
              <div className="mt-2">
                <Tabs value={imageTab} onValueChange={setImageTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">
                      <Upload className="size-4 mr-2" /> Importer une image
                    </TabsTrigger>
                    <TabsTrigger value="url">
                      <LinkIcon className="size-4 mr-2" /> Utiliser un lien
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4 space-y-3">
                    {/* Zone de dépôt */}
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "relative border-2 border-dashed rounded-xl p-8 text-center transition-all",
                        "hover:border-primary/50 hover:bg-primary/5",
                        (uploadedFile || hasInitialImage) ? "border-primary bg-primary/5" : "border-border",
                        uploadError && "border-destructive bg-destructive/5"
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={PUBLICITE_ACCEPT_ATTRIBUTE}
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isSubmitting}
                        aria-label="Importer une image"
                      />
                      {(uploadedFile || hasInitialImage) && imagePreview ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <img
                              src={imagePreview}
                              alt="Aperçu"
                              className="max-h-32 max-w-full rounded-lg shadow-sm"
                            />
                          </div>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {uploadedFile && (
                              <>
                                <span className="text-sm text-muted-foreground">
                                  {uploadedFile.name} ({formatBytes(uploadedFile.size)})
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="size-3 mr-1" /> Changer
                                </Button>
                              </>
                            )}
                            {hasInitialImage && !uploadedFile && (
                              <>
                                <span className="text-sm text-muted-foreground">
                                  Image actuelle
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="size-3 mr-1" /> Remplacer
                                </Button>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeImage}
                            >
                              <Trash2 className="size-3 mr-1" /> Supprimer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="size-12 mx-auto text-muted-foreground/50" />
                          <p className="mt-2 text-lg font-medium text-foreground">
                            Cliquez pour ajouter votre bannière publicitaire
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Format horizontal recommandé : <strong>1200 × 200 px</strong>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Formats acceptés : JPG, PNG et WebP — Max 5 Mo
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Ou glissez-déposez votre fichier ici
                          </p>
                        </>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <X className="size-4" /> {uploadError}
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="imageUrl">URL de l'image</Label>
                      <Input
                        id="imageUrl"
                        placeholder="https://example.com/image.jpg"
                        value={watchedImage}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Lien direct vers une image (JPG, PNG, WebP) — Max 5 Mo
                      </p>
                    </div>
                    {watchedImage && (
                      <div className="relative max-w-xs">
                        <img
                          src={watchedImage}
                          alt="Aperçu"
                          className="w-full h-auto rounded-lg shadow-sm border"
                          onError={() => setUploadError("Impossible de charger l'image depuis cette URL")}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => handleUrlChange("")}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    )}
                    {uploadError && imageTab === "url" && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <X className="size-4" /> {uploadError}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div>
              <Label htmlFor="linkUrl">Lien de destination</Label>
              <Input
                id="linkUrl"
                placeholder="https://..."
                {...form.register("linkUrl")}
                className="mt-1"
              />
            </div>
          </div>
        );

      case "placement":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="slot">Emplacement *</Label>
              <Select onValueChange={form.setValue("slot")} defaultValue={form.getValues("slot")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un emplacement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_hero">Accueil — sous la bannière</SelectItem>
                  <SelectItem value="home_search">Accueil — au-dessus de « Trouver mon Gaz »</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Statut *</Label>
              <Select onValueChange={form.setValue("status")} defaultValue={form.getValues("status")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="scheduled">Programmée</SelectItem>
                  <SelectItem value="active">En cours</SelectItem>
                  <SelectItem value="expired">Terminée</SelectItem>
                  <SelectItem value="suspended">Suspendue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "schedule":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="startAt">Début de diffusion</Label>
              <Input
                id="startAt"
                type="datetime-local"
                {...form.register("startAt")}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Laisser vide pour diffusion immédiate</p>
            </div>
            <div>
              <Label htmlFor="endAt">Fin de diffusion</Label>
              <Input
                id="endAt"
                type="datetime-local"
                {...form.register("endAt")}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Laisser vide pour sans limite</p>
            </div>
            <div>
              <Label htmlFor="duration">Durée d'affichage (secondes)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                max={30}
                step={1}
                {...form.register("duration", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Entre 5 et 30 secondes (défaut: 8)</p>
            </div>
          </div>
        );

      case "advanced":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={100}
                step={1}
                {...form.register("priority", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Plus la priorité est haute, plus la pub est diffusée souvent (0–100)</p>
            </div>
            <div>
              <Label htmlFor="displayOrder">Ordre d'affichage</Label>
              <Input
                id="displayOrder"
                type="number"
                min={0}
                max={1000}
                step={1}
                {...form.register("displayOrder", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Ordre manuel de diffusion (0–1000)</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full min-h-[600px] flex-col lg:flex-row gap-6">
      {/* COLONNE GAUCHE - FORMULAIRE */}
      <div className="flex-1 lg:w-2/3 flex flex-col min-w-0">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{isEditing ? "Modifier l'annonce" : "Nouvelle annonce publicitaire"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Les changements sont immédiatement enregistrés en base."
                : "Renseignez les informations de l'annonce. L'image sera stockée dans Neon."}
            </CardDescription>
          </CardHeader>

          {/* Indicateur de progression des étapes */}
          <div className="px-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        index < activeStep
                          ? "bg-primary text-primary-foreground"
                          : index === activeStep
                          ? "bg-primary/20 text-primary border border-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index < activeStep ? <Check className="size-4" /> : <span>{index + 1}</span>}
                    </div>
                    <span className={cn("text-xs mt-1 font-medium", index <= activeStep ? "text-foreground" : "text-muted-foreground")}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "hidden lg:block flex-1 h-1 mx-2 transition-colors",
                        index < activeStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <CardContent className="flex-1 overflow-y-auto p-6">
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
              <div className="flex-1">
                {renderStepContent()}
              </div>

              <Separator className="my-4" />

              {/* Navigation étapes + Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    disabled={isFirstStep}
                    className="gap-1"
                  >
                    <ChevronRight className="size-4 rotate-180" />
                    Précédent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={isLastStep}
                    className="gap-1"
                  >
                    Suivant
                    <ChevronRight className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || form.formState.isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting || form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        {isEditing ? "Enregistrer" : "Créer la publicité"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* COLONNE DROITE - APERÇU EN DIRECT */}
      <div className="hidden lg:block lg:w-1/3">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Aperçu en direct</CardTitle>
                <CardDescription>Mise à jour automatique à chaque modification</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Eye className="size-3" />
                Prévisualisation
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Contexte de la page */}
              <div className="p-4 border-b bg-muted/30">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {previewData?.slot === "home_search" ? "Sections de la page…" : "Section d'accueil (Hero)"}
                </div>
              </div>

              {/* Aperçu principal - utilise exactement le même composant que le front-end */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                <div className="w-full max-w-[800px]">
                  {previewData && (
                    <PubliciteBannerCard
                      ad={previewData}
                      interactive={false}
                      animate={false}
                    />
                  )}
                </div>
              </div>

              {/* Contexte bas */}
              <div className="p-4 border-t bg-muted/30">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {previewData?.slot === "home_search" ? "« Trouver mon Gaz » — recherche" : "Suite de la page…"}
                </div>
              </div>

              {/* Infos techniques */}
              <div className="p-4 border-t bg-muted/50">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Statut</span>
                    <span className="font-medium text-foreground capitalize">{previewData?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Emplacement</span>
                    <span className="font-medium text-foreground">{slotLabels[previewData?.slot || ""] || previewData?.slot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durée</span>
                    <span className="font-medium text-foreground">{(previewData?.duration || 8000) / 1000}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priorité</span>
                    <span className="font-medium text-foreground">{previewData?.priority || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ordre</span>
                    <span className="font-medium text-foreground">{previewData?.displayOrder || 0}</span>
                  </div>
                  {previewData?.linkUrl && (
                    <div className="flex justify-between">
                      <span>Lien</span>
                      <a
                        href={previewData.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="size-3" />
                        Voir
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aperçu mobile - en bas sur petit écran */}
      <div className="lg:hidden">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Aperçu</CardTitle>
                <CardDescription>Mise à jour automatique</CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Eye className="size-3" />
                Prévisualisation
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="w-full max-w-[800px] mx-auto">
              {previewData && (
                <PubliciteBannerCard
                  ad={previewData}
                  interactive={false}
                  animate={false}
                />
              )}
            </div>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Statut</span>
                <span className="font-medium text-foreground capitalize">{previewData?.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Emplacement</span>
                <span className="font-medium text-foreground">{slotLabels[previewData?.slot || ""] || previewData?.slot}</span>
              </div>
              <div className="flex justify-between">
                <span>Durée</span>
                <span className="font-medium text-foreground">{(previewData?.duration || 8000) / 1000}s</span>
              </div>
              <div className="flex justify-between">
                <span>Priorité</span>
                <span className="font-medium text-foreground">{previewData?.priority || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Ordre</span>
                <span className="font-medium text-foreground">{previewData?.displayOrder || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}