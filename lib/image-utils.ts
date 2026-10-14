/**
 * Optimisation des images côté navigateur.
 *
 * Utilisé uniquement par les composants client (formulaire Marketing).
 * Aucune dépendance externe : l'image est redimensionnée via un <canvas> puis
 * exportée en WebP (repli JPEG si le navigateur ne le supporte pas).
 */

import {
  PUBLICITE_IMAGE_MAX_BYTES,
  formatBytes,
} from "@/lib/publicite-config"

/** Dimension maximale (le plus grand côté) après redimensionnement. */
export const IMAGE_MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.82
const JPEG_QUALITY = 0.85

export type OptimizeImageResult =
  | {
      ok: true
      dataUrl: string
      bytes: number
      width: number
      height: number
      format: "webp" | "jpeg"
      originalBytes: number
      resized: boolean
    }
  | { ok: false; error: string }

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () =>
      reject(reader.error ?? new Error("Lecture du fichier impossible."))
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new Error("Image illisible ou format non pris en charge."))
    image.src = src
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== "function") {
      resolve(null)
      return
    }
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

/**
 * Convertit et redimensionne un fichier image.
 * - refuse les fichiers > 5 Mo AVANT traitement (poids réel du fichier) ;
 * - redimensionne sans déformer le ratio (le plus grand côté ≤ 1600 px) ;
 * - convertit en WebP, avec repli JPEG ;
 * - renvoie une erreur explicite en cas d'échec sans interrompre le dashboard.
 */
export async function optimizeImageFile(file: File): Promise<OptimizeImageResult> {
  if (!file.type.startsWith("image/")) {
    return {
      ok: false,
      error: `Ce fichier n'est pas une image reconnue (${file.type || "type inconnu"}).`,
    }
  }

  if (file.size > PUBLICITE_IMAGE_MAX_BYTES) {
    return {
      ok: false,
      error: `Image trop lourde : ${formatBytes(file.size)} (5 Mo maximum).`,
    }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    if (!width || !height) {
      return { ok: false, error: "Dimensions de l'image introuvables." }
    }

    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(width, height))
    const targetWidth = Math.max(1, Math.round(width * scale))
    const targetHeight = Math.max(1, Math.round(height * scale))
    const resized = targetWidth !== width || targetHeight !== height

    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext("2d")
    if (!context) {
      return {
        ok: false,
        error: "Traitement de l'image indisponible dans ce navigateur.",
      }
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    // Le JPEG ne gère pas la transparence : fond blanc pour éviter du noir.
    if (file.type === "image/jpeg") {
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, targetWidth, targetHeight)
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight)

    let format: "webp" | "jpeg" = "webp"
    let blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY)
    if (!blob || (blob.type && blob.type !== "image/webp")) {
      format = "jpeg"
      blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY)
    }

    if (!blob) {
      return { ok: false, error: "Conversion de l'image impossible." }
    }

    if (blob.size > PUBLICITE_IMAGE_MAX_BYTES) {
      return {
        ok: false,
        error: `Image convertie encore trop lourde : ${formatBytes(blob.size)}.`,
      }
    }

    const dataUrl = await readAsDataUrl(blob)
    return {
      ok: true,
      dataUrl,
      bytes: blob.size,
      width: targetWidth,
      height: targetHeight,
      format,
      originalBytes: file.size,
      resized,
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur inattendue pendant le traitement de l'image.",
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
