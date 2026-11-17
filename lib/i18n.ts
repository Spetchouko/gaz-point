"use client"

import { useLang } from "@/app/_components/lang-provider"
import fr from "@/app/locales/fr.json"
import en from "@/app/locales/en.json"

const maps: Record<string, Record<string, string>> = {
  fr: fr as Record<string, string>,
  en: en as Record<string, string>,
}

export function useTranslation() {
  const { lang } = useLang()
  const data = maps[lang] ?? maps["fr"]
  return (key: string, fallback?: string) => data[key] ?? fallback ?? key
}
