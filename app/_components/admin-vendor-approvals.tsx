"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Mail, MapPin, Phone, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/gaz"

type VendorApproval = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  approvalStatus: "pending" | "approved" | "rejected" | "none"
  approvalRequestedAt: string | null
  approvalProcessedAt: string | null
  rejectionReason: string | null
  points: {
    id: string
    name: string
    district: string
    address: string
  }[]
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
  none: "Non demandé",
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-600 border-red-500/30",
  none: "bg-muted text-muted-foreground border-muted/30",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="size-3.5" />,
  approved: <CheckCircle className="size-3.5" />,
  rejected: <XCircle className="size-3.5" />,
  none: <AlertCircle className="size-3.5" />,
}

type Props = {
  approvals: VendorApproval[]
}

export function AdminVendorApprovals({ approvals }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleApprove = async (vendorId: string) => {
    setLoadingId(vendorId)
    try {
      const res = await fetch("/api/admin/vendors/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        alert(data.error || "Erreur lors de l'approbation")
      } else {
        window.location.reload()
      }
    } catch {
      alert("Erreur lors de l'approbation")
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (vendorId: string) => {
    const reason = prompt("Motif du refus (optionnel) :")
    if (reason === null) return // User cancelled

    setLoadingId(vendorId)
    try {
      const res = await fetch("/api/admin/vendors/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, reason: reason || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        alert(data.error || "Erreur lors du refus")
      } else {
        window.location.reload()
      }
    } catch {
      alert("Erreur lors du refus")
    } finally {
      setLoadingId(null)
    }
  }

  const pendingApprovals = approvals.filter((a) => a.approvalStatus === "pending")
  const processedApprovals = approvals.filter((a) => a.approvalStatus === "approved" || a.approvalStatus === "rejected")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />
          Demandes de validation des vendeurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingApprovals.length === 0 && processedApprovals.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Aucune demande de validation</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingApprovals.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                    {pendingApprovals.length} en attente
                  </span>
                  En attente de validation
                </h3>
                <div className="space-y-4">
                  {pendingApprovals.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="rounded-lg border bg-amber-50/50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-foreground">{vendor.name}</h4>
                            <Badge
                              variant="outline"
                              className={cn(statusColors.pending)}
                            >
                              {statusIcons.pending}
                              <span className="ml-1">En attente</span>
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{vendor.email}</p>
                          {vendor.phoneNumber && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="size-3.5" />
                              {vendor.phoneNumber}
                            </p>
                          )}
                          {vendor.points.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {vendor.points.map((point) => (
                                <p
                                  key={point.id}
                                  className="text-xs text-muted-foreground flex items-center gap-1"
                                >
                                  <MapPin className="size-3" />
                                  {point.name} — {point.address}, {point.district}
                                </p>
                              ))}
                            </div>
                          )}
                          {vendor.approvalRequestedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Demande le {formatDateTime(vendor.approvalRequestedAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            onClick={() => handleApprove(vendor.id)}
                            disabled={loadingId === vendor.id}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-emerald-50"
                          >
                            {loadingId === vendor.id ? (
                              <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Approbation...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="size-4 mr-2" />
                                Approuver
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(vendor.id)}
                            disabled={loadingId === vendor.id}
                            className="gap-2"
                          >
                            {loadingId === vendor.id ? (
                              <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Refus...
                              </>
                            ) : (
                              <>
                                <XCircle className="size-4 mr-2" />
                                Refuser
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {processedApprovals.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium">
                    {processedApprovals.length} traitées
                  </span>
                  Historique des décisions
                </h3>
                <div className="space-y-3">
                  {processedApprovals.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">{vendor.name}</h4>
                          <Badge
                            variant="outline"
                            className={cn(statusColors[vendor.approvalStatus] || statusColors.none)}
                          >
                            {statusIcons[vendor.approvalStatus]}
                            <span className="ml-1">{statusLabels[vendor.approvalStatus]}</span>
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-muted-foreground shrink-0">
                          {vendor.approvalProcessedAt && (
                            <p>Traité le {formatDateTime(vendor.approvalProcessedAt)}</p>
                          )}
                          {vendor.rejectionReason && vendor.approvalStatus === "rejected" && (
                            <p className="text-red-600 mt-1 text-xs">
                              Motif : {vendor.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}