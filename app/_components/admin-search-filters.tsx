"use client"

import { Search, Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type AdminSearchFiltersProps = {
  searchValue: string
  statusValue: string
  sortValue: string
  statusOptions: { value: string; label: string }[]
  sortOptions: { value: string; label: string }[]
  onSearchChange?: (value: string) => void
  onStatusChange?: (value: string) => void
  onSortChange?: (value: string) => void
  extraFilters?: React.ReactNode
}

export function AdminSearchFilters({
  searchValue,
  statusValue,
  sortValue,
  statusOptions,
  sortOptions,
}: AdminSearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[250px] max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          placeholder="Rechercher (nom, email, téléphone)..."
          value={searchValue}
          className="pl-10 h-10"
          aria-label="Rechercher un utilisateur"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusValue} onValueChange={onStatusChange ?? (() => {})}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortValue} onValueChange={onSortChange ?? (() => {})}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {extraFilters}
      </div>
    </div>
  )
}