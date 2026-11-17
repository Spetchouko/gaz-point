"use client"

import { useState, useCallback } from "react"
import { Calendar, Clock, History, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type PeriodValue = "today" | "7" | "30" | "90" | "year" | "custom"

interface PeriodOption {
  value: PeriodValue
  label: string
  icon: React.ElementType
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "today", label: "Aujourd'hui", icon: Sun },
  { value: "7", label: "7 derniers jours", icon: History },
  { value: "30", label: "30 derniers jours", icon: Clock },
  { value: "90", label: "90 derniers jours", icon: Calendar },
  { value: "year", label: "Cette année", icon: Calendar },
  { value: "custom", label: "Personnalisée", icon: Calendar },
]

interface PeriodFilterProps {
  period: PeriodValue
  from: string | null
  to: string | null
  onChange: (value: {
    period: PeriodValue
    from: string | null
    to: string | null
  }) => void
}

export function PeriodFilter({
  period,
  from,
  to,
  onChange,
}: PeriodFilterProps) {
  const [customFrom, setCustomFrom] = useState(from ?? "")
  const [customTo, setCustomTo] = useState(to ?? "")

  const handleSelect = useCallback(
    (value: PeriodValue, fromDate: string | null = null, toDate: string | null = null) => {
      onChange({ period: value, from: fromDate, to: toDate })
    },
    [onChange],
  )

  const isCustom = period === "custom"

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider sm:mr-2">
          Période
        </span>
        <div className="flex w-full sm:w-auto items-center rounded-xl bg-muted border border-border p-1">
          {PERIOD_OPTIONS.map((option) => {
            const active = period === option.value
            const Icon = option.icon
            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  !active && option.value === "custom" && "px-2.5",
                )}
              >
                <Icon className="size-4" />
                {option.value !== "custom" && <span>{option.label}</span>}
              </Button>
            )
          })}
        </div>
      </div>

      {isCustom && (
        <div className="flex items-end gap-3 w-full sm:w-auto">
          <div className="flex-1 min-w-0">
            <Label htmlFor="custom-from" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Du
            </Label>
            <Input
              id="custom-from"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="input input-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="custom-to" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Au
            </Label>
            <Input
              id="custom-to"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="input input-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              handleSelect("custom", customFrom || null, customTo || null)
            }
            className="btn-sm"
          >
            Appliquer
          </Button>
        </div>
      )}
    </div>
  )
}
