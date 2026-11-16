# Harmonisation des séparations visuelles — GazPoints

**Status**: Proposed
**Date**: 2026-10-24
**Mode**: CROSS-CUTTING

## Summary

Remplacer les séparateurs trop épais et trop contrastés par des solutions fines (1px max), neutres, et cohérentes sur l'ensemble du projet : landing page, dashboards (admin, vendeur, client), composants partagés, modales, menus, tableaux, formulaires.

## Requirements

- **REQ-1** : Bordures standards à 1px, couleur `border-border` (clair) / adapté au thème sombre
- **REQ-2** : Tables → `divide-y divide-border` au lieu de `divide-y` seul (currentColor trop foncé)
- **REQ-3** : Cards → retirer le `ring-1 ring-foreground/5` par défaut du composant Card, laisser les pages choisir `border` ou `border-0` explicitement
- **REQ-4** : Sidebar admin, AdminNav, AdminTopBar → `border-border` explicite
- **REQ-5** : Sheet (drawer) → borders `border-border` au lieu de currentColor
- **REQ-6** : Dialog → `border-border` au lieu de currentColor
- **REQ-7** : DashboardNav container → `border-border`
- **REQ-8** : Accordion → `border-border` pour les dividers
- **REQ-9** : Sections avec `border-y` → remplacer par espacement + fond différencié ou `border-t border-border` seul
- **REQ-10** : Conserver les bordures fonctionnelles (focus, error, active) inchangées

## Decision

### Tokens de couleur à utiliser

| Usage | Classe Tailwind | Variable CSS |
|-------|-----------------|--------------|
| Séparateur standard | `border-border` | `--color-border` (#dfe8e2 clair) |
| Séparateur très subtil | `border-muted/20` | `--color-muted` avec opacité |
| Séparateur table | `divide-border` | `--color-border` |
| Focus/Error/Active | Existants (`border-ring`, `border-destructive`, `border-primary`) | Inchangés |

### Composants à modifier (centralisés)

1. **`components/ui/card.tsx`** — retirer `ring-1 ring-foreground/5` du Card root
2. **`components/ui/separator.tsx`** — déjà correct (`bg-border`)
3. **`components/ui/accordion.tsx`** — `not-last:border-b` → `not-last:border-b border-border`
4. **`components/ui/sheet.tsx`** — borders `border-t`, `border-b`, `border-l`, `border-r` → `border-border`
5. **`components/ui/dialog.tsx`** — `border` → `border-border`
6. **`components/ui/tabs.tsx`** — TabsList `border` → `border-border` (déjà `bg-muted` pour fond)

### Fichiers pages/sections à corriger (échantillon représentatif)

- `app/header.tsx` — `border-b border-border` ✓ (déjà bon)
- `app/_components/footer.tsx` — Separator ✓
- `app/_components/admin-nav.tsx` — `border-b`/`border-t` → `border-border`
- `app/_components/admin-top-bar.tsx` — `border-b` → `border-border`
- `app/_components/dashboard-nav.tsx` — `border` → `border-border`
- `app/admin/(protected)/layout.tsx` — `border-r` → `border-border`
- Tables admin (8 fichiers) — `divide-y` → `divide-y divide-border`
- Sections `border-y` (storytelling, notre-demarche, notre-promesse, equipe, acces, contact-form) → alléger

### Préserver (bordures fonctionnelles)

- Inputs focus (`focus-visible:border-ring`)
- Badges outline (`border-border` déjà)
- Alertes (`border` dans cva)
- États error/success/warning avec couleurs sémantiques
- Avatar `ring-2 ring-background`
- DropdownMenuSeparator (`bg-muted` déjà subtil)

## Build plan

1. **Card.tsx** — retirer `ring-1 ring-foreground/5` + `has-data-[slot=card-footer]:pb-0` lié au ring
2. **Accordion.tsx** — ajouter `border-border` au divider
3. **Sheet.tsx** — ajouter `border-border` aux 4 côtés
4. **Dialog.tsx** — ajouter `border-border` au popup
5. **Tables admin** (8 fichiers) — `divide-y divide-border`
6. **AdminNav.tsx** — `border-b border-border`, `border-t border-border`
7. **AdminTopBar.tsx** — `border-b border-border`
8. **DashboardNav.tsx** — `border border-border`
9. **Admin layout** — `border-r border-border`
10. **Sections `border-y`** — remplacer par `border-t border-border` + espacement ou fond différencié
11. **Build + lint + typecheck** — vérifier aucune régression

## Consequences

- **Positif** : interface plus légère, moderne, cohérente clair/sombre
- **Risque** : Cards sans bordure par défaut → certaines pages devront ajouter `border` explicitement si besoin (déjà le cas pour beaucoup avec `border-0`)
- **Migration** : progressive, composants partagés d'abord, puis pages

## Follow-up

- Vérifier toutes les pages listées dans l'audit après build
- Confirmer thème clair + thème sombre (si activé)
- Documenter la convention dans AGENTS.md si pas déjà fait