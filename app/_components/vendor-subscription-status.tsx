"use client"

import { useEffect, useState } from "react"
import { Calendar, AlertCircle, CheckCircle2, CreditCard, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SubscriptionStatus {
  status: string
  isActive: boolean
  currentPeriodEnd: string | null
  lastPaymentAt: string | null
  amount: number
  currency: string
}

export function VendorSubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/vendor/subscription")
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error("[VendorSubscriptionStatus] Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
        <span>Vérification abonnement…</span>
      </div>
    )
  }

  if (!subscription) {
    return null
  }

  const { status, isActive, currentPeriodEnd, lastPaymentAt, amount, currency } = subscription

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getStatusConfig = () => {
    if (isActive) {
      return {
        label: "Abonnement actif",
        description: currentPeriodEnd ? `Expire le ${formatDate(currentPeriodEnd)}` : "Actif",
        icon: CheckCircle2,
        iconColor: "text-success",
        bgColor: "bg-success/10",
        borderColor: "border-success/20",
        textColor: "text-success",
      }
    }
    if (status === "past_due") {
      return {
        label: "Paiement en retard",
        description: "Veuillez renouveler votre abonnement",
        icon: AlertCircle,
        iconColor: "text-destructive",
        bgColor: "bg-destructive/10",
        borderColor: "border-destructive/20",
        textColor: "text-destructive",
      }
    }
    if (status === "cancelled") {
      return {
        label: "Abonnement annulé",
        description: lastPaymentAt ? `Annulé le ${formatDate(lastPaymentAt)}` : "Annulé",
        icon: AlertCircle,
        iconColor: "text-muted-foreground",
        bgColor: "bg-muted/50",
        borderColor: "border-border",
        textColor: "text-muted-foreground",
      }
    }
    return {
      label: "Abonnement inactif",
      description: "Souscrivez pour accéder au tableau de bord",
      icon: CreditCard,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
      textColor: "text-warning",
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-colors",
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex items-start gap-2">
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", config.iconColor)}>
          <Icon className="size-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm truncate", config.textColor)}>
            {config.label}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {config.description}
          </p>
          {lastPaymentAt && (
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Dernier paiement : {formatDate(lastPaymentAt)}
            </p>
          )}
        </div>
      </div>
      {!isActive && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 gap-1.5"
          onClick={() => window.location.href = "/paiement/abonnement"}
        >
          <CreditCard className="size-3.5" />
          {status === "none" ? "Souscrire" : "Renouveler"}
          <ExternalLink className="size-3" />
        </Button>
      )}
    </div>
  )
}