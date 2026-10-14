"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { CheckCircle, Image as ImageIcon, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateAdminAvatar } from "@/app/admin/actions"

interface AvatarUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  currentImage: string | null
  onImageSave: (imageUrl: string) => void
}

export function AvatarUploadDialog({
  isOpen,
  onClose,
  currentImage,
  onImageSave,
}: AvatarUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    }
  }, [selectedFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSave = async () => {
    if (!previewUrl) {
      setSaveError("Aucune image à enregistrer")
      return
    }
    setIsSaving(true)
    setSaveError(null)
    try {
      const formData = new FormData()
      formData.set("image", previewUrl)

      const result = await updateAdminAvatar(null, formData)

      if (!result.ok) {
        setSaveError(result.message)
        setIsSaving(false)
        return
      }

      onImageSave(previewUrl)
      onClose()
    } catch (error) {
      setSaveError("Erreur lors de l'enregistrement de l'image")
      console.error("Avatar save error:", error)
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Photo d'administration</DialogTitle>
          <DialogDescription>
            Changer la photo du tableau de bord administrateur
          </DialogDescription>
        </DialogHeader>

        {/* Current avatar preview */}
        <div className="mb-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Aperçu photo"
              className="w-32 h-32 rounded-full object-cover mx-auto border-2 border-primary"
            />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto border-2 border-gray-300 flex items-center justify-center">
              <ImageIcon className="size-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* File input */}
        <div className="mb-4">
          <Label htmlFor="avatar-file">Sélectionner une image</Label>
          <Input
            id="avatar-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => (document.getElementById("avatar-file") as HTMLInputElement)?.click()}
            disabled={isSaving}
          >
            {selectedFile ? "Changer d'image" : "Sélectionner une image"}
          </Button>
        </div>

        {/* Error message */}
        {saveError && (
          <p className="mb-4 text-sm text-red-600">{saveError}</p>
        )}

        {/* Save button */}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl)
              }
              onClose()
            }}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button disabled={isSaving} type="submit">
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="size-4 mr-1" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}