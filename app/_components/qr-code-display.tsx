"use client"

import { Download, Copy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface QRCodeDisplayProps {
  qrCodeDataUrl: string
  reservationCode: string
  className?: string
}

export function QRCodeDisplay({ qrCodeDataUrl, reservationCode, className }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = qrCodeDataUrl
    link.download = `reservation-${reservationCode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservationCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          QR Code de la réservation
        </p>
        <div className="bg-background p-4 rounded-lg border border-border shadow-sm inline-block">
          <img
            src={qrCodeDataUrl}
            alt={`QR Code réservation ${reservationCode}`}
            className="w-48 h-48"
          />
        </div>
        <p className="text-center font-mono text-lg font-bold tracking-wider text-primary">
          {reservationCode}
        </p>
        <p className="text-xs text-muted-foreground text-center">
          À présenter au vendeur pour le retrait
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCode}
          className="gap-1.5"
        >
          {copied ? (
            <>
              <CheckCircle className="size-3.5 text-success" />
              Copié
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copier le code
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <Download className="size-3.5" />
          Télécharger QR
        </Button>
      </div>
    </div>
  )
}