"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronRight,
  Check,
  Loader2,
  Save,
  Eye,
  ExternalLink,
  Upload,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Palette,
  Image as ImageIcon2,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  LayoutDashboard,
  Download,
} from "lucide-react";
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
import { PubliciteBannerCard, type PubliciteBannerData, type PubliciteMode } from "@/app/_components/publicite-banner";
import {
  PUBLICITE_IMAGE_MAX_BYTES,
  PUBLICITE_ACCEPTED_MIME,
  PUBLICITE_ACCEPT_ATTRIBUTE,
  formatBytes,
} from "@/lib/publicite-config";

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

// Schémas pour les deux modes
const fullBannerSchema = z.object({
  campaignName: z.string().min(1, "Le nom de la campagne est requis").max(60),
  image: z.string().optional().or(z.literal("")),
  linkUrl: z.string().optional().or(z.literal("")),
  slot: z.string(),
  status: z.enum(["draft", "scheduled", "active", "expired", "suspended"]),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  duration: z.number().int().min(5).max(30).optional().nullable(),
  priority: z.number().int().min(0).max(100).optional().nullable(),
  displayOrder: z.number().int().min(0).max(1000).optional().nullable(),
  mode: z.literal("full_banner"),
});

const composedSchema = z.object({
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
  mode: z.literal("composed"),
  // Champs de style pour mode composed
  textAlign: z.enum(["left", "center", "right"]).optional(),
  textColor: z.string().optional(),
  backgroundOverlay: z.string().optional(),
  imageFit: z.enum(["cover", "contain"]).optional(),
  titlePosition: z.enum([
    "top-left", "top-center", "top-right",
    "center-left", "center", "center-right",
    "bottom-left", "bottom-center", "bottom-right"
  ]).optional(),
  descriptionPosition: z.enum([
    "top-left", "top-center", "top-right",
    "center-left", "center", "center-right",
    "bottom-left", "bottom-center", "bottom-right"
  ]).optional(),
});

type FullBannerFormValues = z.infer<typeof fullBannerSchema>;
type ComposedFormValues = z.infer<typeof composedSchema>;
type AnyFormValues = FullBannerFormValues | ComposedFormValues;

interface PubliciteFormProps {
  initialData?: Partial<AnyFormValues> | null;
  isEditing?: boolean;
  onSubmit: (values: AnyFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

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

const positionOptions = [
  { value: "top-left", label: "Haut gauche", icon: "↖" },
  { value: "top-center", label: "Haut centre", icon: "↑" },
  { value: "top-right", label: "Haut droite", icon: "↗" },
  { value: "center-left", label: "Centre gauche", icon: "←" },
  { value: "center", label: "Centre", icon: "⊙" },
  { value: "center-right", label: "Centre droite", icon: "→" },
  { value: "bottom-left", label: "Bas gauche", icon: "↙" },
  { value: "bottom-center", label: "Bas centre", icon: "↓" },
  { value: "bottom-right", label: "Bas droite", icon: "↘" },
] as const;

const textAlignOptions = [
  { value: "left", label: "Gauche", icon: AlignLeft },
  { value: "center", label: "Centre", icon: AlignCenter },
  { value: "right", label: "Droite", icon: AlignRight },
] as const;

const imageFitOptions = [
  { value: "cover", label: "Couvrir (cover)", desc: "L'image remplit la zone" },
  { value: "contain", label: "Contenir (contain)", desc: "L'image tient entièrement" },
] as const;

export function PubliciteForm({
  initialData,
  isEditing,
  onSubmit,
  onCancel,
  isSubmitting,
}: PubliciteFormProps) {
  const [mode, setMode] = useState<PubliciteMode | null>(
    initialData?.mode ?? null
  );
  const [showModeSelection, setShowModeSelection] = useState(!initialData?.mode && !isEditing);
  const [activeStep, setActiveStep] = useState(0);
  const [previewData, setPreviewData] = useState<PubliciteBannerData | null>(null);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasInitialImage, setHasInitialImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Formulaires séparés pour chaque mode
  const fullBannerForm = useForm<FullBannerFormValues>({
    resolver: zodResolver(fullBannerSchema),
    defaultValues: {
      campaignName: "",
      image: "",
      linkUrl: "",
      slot: "home_hero",
      status: "draft",
      startAt: "",
      endAt: "",
      duration: 8,
      priority: 0,
      displayOrder: 0,
      mode: "full_banner",
      ...(mode === "full_banner" ? initialData : {}),
    },
  });

  const composedForm = useForm<ComposedFormValues>({
    resolver: zodResolver(composedSchema),
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
      mode: "composed",
      textAlign: "left",
      textColor: "#FFFFFF",
      backgroundOverlay: "rgba(0,0,0,0.3)",
      imageFit: "cover",
      titlePosition: "top-left",
      descriptionPosition: "bottom-left",
      ...(mode === "composed" ? initialData : {}),
    },
  });

  // Sélectionner le formulaire actif
  const form = mode === "full_banner" ? fullBannerForm : composedForm;
  const watchedImage = form.watch("image");

  // Initialize image preview from initialData
  useEffect(() => {
    if (initialData?.image) {
      setImagePreview(initialData.image);
      setHasInitialImage(true);
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
      form.setValue("image", "pending_upload", { shouldValidate: false });
    } else if (imageTab === "url") {
      form.setValue("image", watchedImage, { shouldValidate: false });
    } else if (hasInitialImage && !uploadedFile) {
      form.setValue("image", initialData?.image || "", { shouldValidate: false });
    } else {
      form.setValue("image", "", { shouldValidate: false });
    }
  }, [imageTab, uploadedFile, watchedImage, form, hasInitialImage, initialData?.image]);

  // Mettre à jour l'aperçu en temps réel
  const getFormValues = () => form.getValues();
  const watchedValues = form.watch();

  useEffect(() => {
    const values = getFormValues();
    setPreviewData({
      id: initialData?.id || "preview",
      title: values.title || values.campaignName || "Titre de l'annonce",
      description: values.description || null,
      image: imagePreview,
      price: null,
      priceLabel: null,
      location: null,
      phone: null,
      linkUrl: watchedValues.linkUrl || null,
      startAt: watchedValues.startAt || null,
      endAt: watchedValues.endAt || null,
      status: watchedValues.status || "draft",
      duration: watchedValues.duration ?? 8000,
      priority: watchedValues.priority ?? 0,
      displayOrder: watchedValues.displayOrder ?? 0,
      mode: mode || "composed",
      // Champs composed
      textAlign: watchedValues.textAlign,
      textColor: watchedValues.textColor,
      backgroundOverlay: watchedValues.backgroundOverlay,
      imageFit: watchedValues.imageFit,
      titlePosition: watchedValues.titlePosition,
      descriptionPosition: watchedValues.descriptionPosition,
    });
  }, [
    watchedValues.title,
    watchedValues.campaignName,
    watchedValues.description,
    watchedValues.linkUrl,
    watchedValues.startAt,
    watchedValues.endAt,
    watchedValues.status,
    watchedValues.duration,
    watchedValues.priority,
    watchedValues.displayOrder,
    watchedValues.textAlign,
    watchedValues.textColor,
    watchedValues.backgroundOverlay,
    watchedValues.imageFit,
    watchedValues.titlePosition,
    watchedValues.descriptionPosition,
    imagePreview,
    initialData?.id,
  ]);

  const handleModeSelect = (selectedMode: PubliciteMode) => {
    setMode(selectedMode);
    setShowModeSelection(false);
    setActiveStep(0);
  };

  const handleNext = () => {
    if (activeStep < 2) setActiveStep((s) => s + 1);
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((s) => s - 1);
  };

  const handleFormSubmit = async (values: AnyFormValues) => {
    // Ensure mode is included in the submitted values
    const valuesWithMode = { ...values, mode };
    if (uploadedFile) {
      try {
        const dataUrl = await fileToDataUrl(uploadedFile);
        onSubmit({ ...valuesWithMode, image: dataUrl });
      } catch {
        setUploadError("Erreur lors de la lecture du fichier");
      }
    } else {
      onSubmit(valuesWithMode);
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

  const handleColorChange = (color: string) => {
    form.setValue("textColor", color, { shouldValidate: true });
  };

  const handleOverlayChange = (overlay: string) => {
    form.setValue("backgroundOverlay", overlay, { shouldValidate: true });
  };

  const steps = mode === "full_banner" ? [
    { id: "content", label: "Bannière" },
    { id: "placement", label: "Placement" },
    { id: "schedule", label: "Planification" },
  ] : [
    { id: "content", label: "Contenu" },
    { id: "style", label: "Style" },
    { id: "placement", label: "Placement" },
    { id: "schedule", label: "Planification" },
  ];

  const currentStep = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  // Illustrations SVG pour les cartes de choix de mode
  const FullBannerIllustration = () => (
    <svg viewBox="0 0 300 160" className="w-full h-auto" role="img" aria-label="Exemple de bannière publicitaire finie">
      <defs>
        <linearGradient id="bannerBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f1f3a" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      {/* Fond de la bannière */}
      <rect x="0" y="0" width="300" height="160" rx="8" fill="url(#bannerBg)" />
      
      {/* Zone image de fond (gauche) */}
      <rect x="12" y="12" width="120" height="136" rx="6" fill="#374151" opacity="0.6" />
      <rect x="20" y="20" width="104" height="104" rx="4" fill="#4b5563" />
      <circle cx="72" cy="72" r="24" fill="#6b7280" />
      <rect x="52" y="96" width="40" height="8" rx="2" fill="#9ca3af" />
      
      {/* Zone contenu (droite) */}
      {/* Logo */}
      <rect x="150" y="20" width="48" height="48" rx="8" fill="url(#accentGrad)" />
      <text x="174" y="53" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill="white">GP</text>
      
      {/* Titre principal */}
      <rect x="150" y="80" width="120" height="20" rx="3" fill="#fbbf24" />
      <text x="210" y="94" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill="#1f2937">PROMO ÉTÉ 2025</text>
      
      {/* Sous-titre */}
      <rect x="150" y="110" width="90" height="12" rx="2" fill="#ffffff" opacity="0.9" />
      <text x="195" y="118" textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#1f2937">Bouteille 12,5 kg - 4 500 FCFA</text>
      
      {/* Bouton CTA */}
      <rect x="150" y="132" width="100" height="28" rx="14" fill="url(#accentGrad)" />
      <text x="200" y="147" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="600" fill="white">En savoir plus</text>
      
      {/* Éléments décoratifs */}
      <circle cx="270" cy="30" r="8" fill="#fbbf24" opacity="0.3" />
      <circle cx="280" cy="130" r="6" fill="#ef4444" opacity="0.3" />
      <circle cx="20" cy="130" r="5" fill="#fbbf24" opacity="0.2" />
    </svg>
  );

  const ComposedAdIllustration = () => (
    <svg viewBox="0 0 300 160" className="w-full h-auto" role="img" aria-label="Exemple de publicité composée en cours de création">
      <defs>
        <linearGradient id="composedBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="imageGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Fond de la carte */}
      <rect x="0" y="0" width="300" height="160" rx="8" fill="url(#composedBg)" stroke="#e2e8f0" strokeWidth="1" />
      
      {/* Zone image (gauche) */}
      <rect x="12" y="12" width="120" height="136" rx="6" fill="url(#imageGrad)" />
      <rect x="30" y="30" width="84" height="84" rx="6" fill="#ffffff" opacity="0.2" />
      <circle cx="72" cy="72" r="20" fill="#ffffff" opacity="0.3" />
      <path d="M56 72 L68 84 L84 60" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      
      {/* Zone texte superposée (droite) */}
      {/* Overlay semi-transparent */}
      <rect x="144" y="12" width="144" height="136" rx="6" fill="#000000" opacity="0.25" />
      
      {/* Titre */}
      <text x="216" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="bold" fill="white">Promo Gaz 12,5 kg</text>
      
      {/* Description */}
      <text x="216" y="80" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white" opacity="0.95">
        <tspan x="216" dy="0">Bouteille 12,5 kg disponible</tspan>
        <tspan x="216" dy="14">dans votre quartier</tspan>
      </text>
      
      {/* Bouton CTA */}
      <rect x="172" y="108" width="112" height="32" rx="16" fill="url(#btnGrad)" filter="drop-shadow(0 2px 4px rgba(37,99,235,0.3))" />
      <text x="216" y="125" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600" fill="white">En savoir plus</text>
      
      {/* Indicateur de composition */}
      <g opacity="0.6">
        <rect x="150" y="140" width="12" height="12" rx="2" fill="#6366f1" />
        <text x="156" y="149" fontSize="7" fill="white" fontWeight="bold">+</text>
        <rect x="168" y="140" width="12" height="12" rx="2" fill="#f59e0b" />
        <text x="174" y="149" fontSize="7" fill="white" fontWeight="bold">T</text>
        <rect x="186" y="140" width="12" height="12" rx="2" fill="#ef4444" />
        <text x="192" y="149" fontSize="7" fill="white" fontWeight="bold">B</text>
      </g>
      
      {/* Curseur d'édition (indicateur visuel) */}
      <line x1="280" y1="20" x2="280" y2="140" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,4" opacity="0.5" />
      <circle cx="280" cy="80" r="4" fill="#6366f1" />
    </svg>
  );

  // Rendu du formulaire selon le mode
  const renderStepContent = () => {
    if (mode === "full_banner") {
      return renderFullBannerStep();
    }
    return renderComposedStep();
  };

  const renderFullBannerStep = () => {
    switch (currentStep.id) {
      case "content":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Nom de la campagne *</Label>
              <Input
                id="campaignName"
                placeholder="Ex: Promo été 2025 - Bannière complète"
                {...fullBannerForm.register("campaignName")}
                className="mt-1"
              />
              {fullBannerForm.formState.errors.campaignName && (
                <p className="text-sm text-destructive mt-1">{fullBannerForm.formState.errors.campaignName.message}</p>
              )}
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
                        placeholder="https://example.com/banniere.jpg"
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
              <Label htmlFor="linkUrl">URL de destination</Label>
              <Input
                id="linkUrl"
                placeholder="https://..."
                {...fullBannerForm.register("linkUrl")}
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
              <Select onValueChange={fullBannerForm.setValue("slot")} defaultValue={fullBannerForm.getValues("slot")}>
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
              <Select onValueChange={fullBannerForm.setValue("status")} defaultValue={fullBannerForm.getValues("status")}>
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
                {...fullBannerForm.register("startAt")}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Laisser vide pour diffusion immédiate</p>
            </div>
            <div>
              <Label htmlFor="endAt">Fin de diffusion</Label>
              <Input
                id="endAt"
                type="datetime-local"
                {...fullBannerForm.register("endAt")}
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
                {...fullBannerForm.register("duration", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Entre 5 et 30 secondes (défaut: 8)</p>
            </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={100}
                step={1}
                {...fullBannerForm.register("priority", { valueAsNumber: true })}
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
                {...fullBannerForm.register("displayOrder", { valueAsNumber: true })}
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

  const renderComposedStep = () => {
    switch (currentStep.id) {
      case "content":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de la publicité *</Label>
              <Input
                id="title"
                placeholder="Ex: Promo gaz 12,5 kg"
                {...composedForm.register("title")}
                className="mt-1"
              />
              {composedForm.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">{composedForm.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Détails de l'offre..."
                {...composedForm.register("description")}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Max 160 caractères</p>
            </div>
            <div>
              <Label>Image de la publicité *</Label>
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
                            Cliquez pour ajouter votre image de fond
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
                {...composedForm.register("linkUrl")}
                className="mt-1"
              />
            </div>
          </div>
        );

      case "style":
        return (
          <div className="space-y-4">
            <div>
              <Label>Alignement du texte</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {textAlignOptions.map((opt) => (
                  <Button
                    type="button"
                    variant={composedForm.watch("textAlign") === opt.value ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 py-3"
                    onClick={() => composedForm.setValue("textAlign", opt.value)}
                  >
                    <opt.icon className="size-5" />
                    <span className="text-xs">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="textColor">Couleur du texte</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  id="textColor"
                  type="color"
                  {...composedForm.register("textColor")}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  id="textColorText"
                  type="text"
                  value={composedForm.watch("textColor") || "#FFFFFF"}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 mt-1 font-mono text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="backgroundOverlay">Fond derrière le texte (overlay)</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  id="backgroundOverlay"
                  type="color"
                  value={composedForm.watch("backgroundOverlay") || "rgba(0,0,0,0.3)"}
                  onChange={(e) => handleOverlayChange(e.target.value)}
                  className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  id="backgroundOverlayText"
                  type="text"
                  value={composedForm.watch("backgroundOverlay") || "rgba(0,0,0,0.3)"}
                  onChange={(e) => handleOverlayChange(e.target.value)}
                  className="flex-1 mt-1 font-mono text-sm"
                  placeholder="rgba(0,0,0,0.3)"
                />
                <p className="text-xs text-muted-foreground ml-10">Format: rgba(r,g,b,a) ou couleur hex</p>
              </div>
            </div>

            <div>
              <Label htmlFor="imageFit">Ajustement de l'image</Label>
              <Select
                onValueChange={composedForm.setValue("imageFit")}
                defaultValue={composedForm.getValues("imageFit") || "cover"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {imageFitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Position du titre</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {positionOptions.map((opt) => (
                  <Button
                    type="button"
                    variant={composedForm.watch("titlePosition") === opt.value ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 py-3"
                    onClick={() => composedForm.setValue("titlePosition", opt.value)}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Position de la description</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {positionOptions.map((opt) => (
                  <Button
                    type="button"
                    variant={composedForm.watch("descriptionPosition") === opt.value ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 py-3"
                    onClick={() => composedForm.setValue("descriptionPosition", opt.value)}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="imageFit">Ajustement de l'image de fond</Label>
              <Select
                onValueChange={composedForm.setValue("imageFit")}
                defaultValue={composedForm.getValues("imageFit") || "cover"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {imageFitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "placement":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="slot">Emplacement *</Label>
              <Select onValueChange={composedForm.setValue("slot")} defaultValue={composedForm.getValues("slot")}>
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
              <Select onValueChange={composedForm.setValue("status")} defaultValue={composedForm.getValues("status")}>
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
                {...composedForm.register("startAt")}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Laisser vide pour diffusion immédiate</p>
            </div>
            <div>
              <Label htmlFor="endAt">Fin de diffusion</Label>
              <Input
                id="endAt"
                type="datetime-local"
                {...composedForm.register("endAt")}
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
                {...composedForm.register("duration", { valueAsNumber: true })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Entre 5 et 30 secondes (défaut: 8)</p>
            </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={100}
                step={1}
                {...composedForm.register("priority", { valueAsNumber: true })}
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
                {...composedForm.register("displayOrder", { valueAsNumber: true })}
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

  // Écran de choix du mode (avant le formulaire)
  if (showModeSelection) {
    return (
      <div className="flex h-full min-h-[600px] flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-2/3 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Nouvelle annonce publicitaire</CardTitle>
              <CardDescription>
                Choisissez le type de publicité que vous souhaitez créer.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Option 1 - Bannière déjà conçue */}
                <Button
                  type="button"
                  variant="outline"
                  className="relative h-full min-h-[320px] flex flex-col items-center justify-center gap-4 p-6 border-2 rounded-xl transition-all duration-200 hover:border-primary hover:bg-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => handleModeSelect("full_banner")}
                >
                  <div className="flex flex-col items-center text-center w-full max-w-lg">
                    <FullBannerIllustration className="w-full max-w-2xl h-auto mb-4" />
                    <h3 className="text-lg font-semibold leading-snug text-foreground hover:text-primary-foreground transition-colors">Bannière déjà conçue</h3>
                    <div className="flex items-center justify-center gap-1.5 text-xs pt-2 border-t border-border/50 w-full max-w-xs">
                      <span className="font-medium text-foreground hover:text-primary-foreground">Format horizontal recommandé</span>
                      <span className="text-border">•</span>
                      <span className="font-mono text-primary">1200 × 200 px</span>
                    </div>
                  </div>
                </Button>

                {/* Option 2 - Publicité personnalisée */}
                <Button
                  type="button"
                  variant="outline"
                  className="relative h-full min-h-[320px] flex flex-col items-center justify-center gap-4 p-6 border-2 rounded-xl transition-all duration-200 hover:border-primary hover:bg-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => handleModeSelect("composed")}
                >
                  <div className="flex flex-col items-center text-center w-full max-w-lg">
                    <ComposedAdIllustration className="w-full max-w-2xl h-auto mb-4" />
                    <h3 className="text-lg font-semibold leading-snug text-foreground hover:text-primary-foreground transition-colors">Créer une publicité personnalisée</h3>
                    <div className="flex items-center justify-center gap-1.5 text-xs pt-2 border-t border-border/50 w-full max-w-xs">
                      <span className="text-foreground hover:text-primary-foreground">Image + texte + bouton</span>
                      <span className="text-border">•</span>
                      <span className="font-mono text-primary">1200 × 200 px</span>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aperçu vide pour le choix de mode */}
        <div className="hidden lg:block lg:w-1/3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Aperçu</CardTitle>
              <CardDescription>Sélectionnez un mode pour voir l'aperçu</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon2 className="size-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Choisissez un type de publicité</p>
                <p className="text-xs mt-1">pour voir l'aperçu en temps réel</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[600px] flex-col lg:flex-row gap-6">
      {/* COLONNE GAUCHE - FORMULAIRE */}
      <div className="flex-1 lg:w-2/3 flex flex-col min-w-0">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {mode === "full_banner" ? "Importer une bannière complète" : "Créer une publicité personnalisée"}
                </CardTitle>
                <CardDescription>
                  {mode === "full_banner"
                    ? "Importez votre bannière pré-conçue avec tous ses éléments graphiques."
                    : "Composez votre publicité : image de fond + titre + description."}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowModeSelection(true); setMode(null); }}
              >
                Changer de mode
              </Button>
            </div>
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

                <input type="hidden" {...form.register("mode")} />
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
                        {isEditing ? "Enregistrer" : mode === "full_banner" ? "Importer la bannière" : "Créer la publicité"}
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

              {/* Infos techniques */}
              <div className="p-4 border-t bg-muted/50">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Mode</span>
                    <span className="font-medium text-foreground capitalize">
                      {previewData?.mode === "full_banner" ? "Bannière complète" : "Publicité composée"}
                    </span>
                  </div>
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
                <span>Mode</span>
                <span className="font-medium text-foreground capitalize">
                  {previewData?.mode === "full_banner" ? "Bannière complète" : "Publicité composée"}
                </span>
              </div>
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