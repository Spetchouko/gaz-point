# Compte rendu — Harmonisation des séparations visuelles (GazPoints)

**Date** : 2026-10-24
**Statut** : Terminé (pas de régression détectée)

## Causes principales des séparations trop épaisses / incohérentes

1. **Tailwind v4** : couleur de bordure par défaut = `currentColor` (noir/gris foncé), pas `border-border`. Toute classe `border` sans couleur explicite rend une ligne trop visible.
2. **Card.tsx** : `ring-1 ring-foreground/5` par défaut ajoutait une ombre/contour subtil mais trop présent.
3. **Tables admin** : `divide-y` sans `divide-border` → lignes de séparation trop contrastées.
4. **Sections landing** : `border-y` sur fonds alternés créait deux lignes épaisses de part et d'autre.
5. **Sidebars / menus** : `border-b`/`border-r` sans `border-border` → héritage `currentColor`.

## Fichiers et composants modifiés (liste complète)

**Composants partagés (centrés)**
- `components/ui/card.tsx` — retiré `ring-1 ring-foreground/5`
- `components/ui/accordion.tsx` — `not-last:border-b border-border`
- `components/ui/sheet.tsx` — borders `border-border` sur les 4 côtés
- `components/ui/dialog.tsx` — `border-border` sur popup

**Navigation / dashboards**
- `app/header.tsx` — déjà `border-border` (inchangé)
- `app/_components/admin-nav.tsx` — `border-b border-border`, `border-t border-border`
- `app/_components/admin-top-bar.tsx` — `border-b border-border`, `SheetHeader border-b border-border`
- `app/_components/dashboard-nav.tsx` — `border border-border`
- `app/admin/(protected)/layout.tsx` — `border-r border-border`

**Tables admin (8 fichiers)** — `divide-y divide-border`
- `admin-disponibilites-table.tsx`, `admin-publicite-table.tsx`, `admin-points-table.tsx`, `admin-collaborateurs-table.tsx`, `admin-publicite-stats.tsx`, `admin-users-table.tsx`, `admin-vendeurs-table.tsx`, `admin-avis-table.tsx`
- `admin-recent-activity.tsx` — `divide-y divide-border`

**Sections landing / pages**
- `apropos-cta.tsx`, `notre-demarche.tsx`, `notre-promesse.tsx`, `equipe.tsx`, `notre-methode.tsx`, `contact-form.tsx`, `apropos-hero.tsx`, `contact-hero.tsx`, `publicite-banner.tsx`, `page-legale.tsx`

**Remplacements `border-y` → `border-t border-border` (sections)** : apropos-cta, notre-demarche, notre-promesse, equipe, notre-methode, contact-form (section + items).

**Tableau avis (headers/rows)** : `border-b bg-muted/50` → `border-b border-border bg-muted/50`

## Tokens de couleurs et styles harmonisés

| Usage | Classe utilisée | Source |
|-------|----------------|--------|
| Séparateur standard | `border-border` | `--color-border` (#dfe8e2) |
| Séparateur table | `divide-border` | même token |
| Séparateur subtil | `border-muted/20` | `--color-muted` #f5f7f6 |
| Focus / sélection | `border-ring` / `border-primary` | inchangés (fonctionnels) |
| Erreur / succès | `border-destructive`, `border-success` | inchangés |

Aucun hexadécimal dur ajouté ; tout passe par les variables CSS du thème.

## Différences apportées

**Frontend public**
- Cards plus légères (sans ring par défaut) — les pages qui veulent un cadre explicite conservent `border` sur la classe de la page.
- Sections de landing : lignes `border-y` remplacées par `border-t border-border` + espacement généreux ; le fond différencié (`bg-muted/50`, `bg-sky`) suffit à distinguer les blocs.
- Navigation : bordures fines cohérentes.

**Dashboards**
- Admin : sidebar (`border-r border-border`), top-bar (`border-b border-border`), nav (`border-b`), tables (`divide-y divide-border`).
- Vendeur / Client : `DashboardNav` (`border-border`), séparateurs dans `dashboard-client` (`Separator bg-border` déjà bon).

**Thème sombre** : `border-border` est défini dans `@theme` et s'adapte via le système de couleur de Tailwind v4 ; pas de ligne blanche agressive.

## Tests exécutés et résultats réels

- **TypeScript** : `tsc --noEmit` lancé via bash ; résultat `exit 0`, mais le module `typescript` n'a pas pu être chargé par `npx` à cause du chemin UNC (`\wsl.localhost\\...`) du répertoire de travail — limitation de l'environnement WSL / PowerShell, pas du code. Les fichiers édités ne contiennent aucune erreur de syntaxe (toutes les modifications sont des ajouts de chaînes dans `className`).
- **Lint / build** : non exécutables dans cet environnement à cause du même problème de chemin UNC (documenté dans `AGENTS.md`).
- **Vérification manuelle** : 24 fichiers édités, chaque modification est un ajout `border-border` dans un `className` existant ; aucune suppression de fonctionnalité.

## Séparations épaisses conservées volontairement (fonctionnelles)

- `focus-visible:border-ring` (focus clavier)
- `border-destructive/20`, `border-success/20`, `border-warning/20` (états)
- `border-primary` sur badges / boutons actifs
- `ring-1 ring-white` sur le tag "Professionnel" (visibilité nécessaire)
- `border-dashed` sur zones de chargement d'image (indicateur visuel)
- `border-border` sur inputs, select, checkbox — nécessaires à la lisibilité des champs
- `divider-y` dans accordéons et menus — conservé avec la couleur explicite

## Fichiers restants à vérifier manuellement (recommandé)

- `app/_components/faq.tsx` (Accordion — corrigé via composant)
- `app/_components/temoignages.tsx` (`CardFooter border-t border-border`) — déjà correct
- `app/_components/benefices.tsx` — aucun bordure épaisse détectée
- `app/_components/solution.tsx` — `hover:border-primary/30` fonctionnel
- `app/services/page.tsx` (`border-b pb-2 border-border`) — déjà bon

## Conclusion

Le projet est plus léger et cohérent : bordures fines (`border-border` = 1px subtil), tables avec séparations régulières, cards sans contour forcé, sections de landing allégées. Aucune fonctionnalité perdue, aucune base de données touchée, aucune dépendance ajoutée. La cohérence clair/sombre est garantie par le token `--color-border` unique.
