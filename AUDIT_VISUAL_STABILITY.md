# Audit de Stabilité Visuelle — GazPoints

**Date :** 10 novembre 2026
**Auteur :** Audit technique complet

---

## Résumé Exécutif

Le site GazPoints présente des **tremblements visuels (layout shifts)** lors de la navigation entre pages et rubriques. Ces mouvements sont causés par **10 causes racines identifiées** ci-dessous, classées par gravité.

---

## Causes Racines Identifiées

### 1. 🔴 Incohérence de Hauteur du Header (CRITIQUE)
| Page | Header | Hauteur |
|------|--------|---------|
| Pages publiques (`app/header.tsx`) | Header principal | **56px** (`h-14`) |
| Dashboard client/vendeur (`dashboard-top-bar.tsx`) | Barre supérieure dashboard | **48px** (`h-12`) |
| Administration (`admin-top-bar.tsx`) | Barre supérieure admin | **48px** (`h-12`) |

**Impact :** À chaque navigation entre page publique ↔ dashboard ↔ admin, le contenu saute de **8px** vers le haut ou le bas.

**Fichiers :**
- `app/header.tsx` ligne 38 : `h-14`
- `app/_components/dashboard-top-bar.tsx` ligne 84 : `h-12`
- `app/_components/admin-top-bar.tsx` ligne 79 : `h-12`

---

### 2. 🔴 Images `fill` sans Espace Réservé (CLS Majeur)
**4 composants** utilisent `<Image fill>` avec des conteneurs aux hauteurs responsives qui changent aux breakpoints :

| Composant | Image | Conteneur (hauteurs) |
|-----------|-------|---------------------|
| `app/hero.tsx` | `/brand/hero.webp` | `min-h-[560px] md:min-h-[640px]` |
| `app/_components/fiabilite.tsx` | `/brand/1.webp` | `h-[380px] sm:h-[460px] lg:h-auto lg:min-h-[560px]` |
| `app/_components/benefices.tsx` | `/brand/kill.png` | `h-[300px] sm:h-[380px] lg:h-auto lg:min-h-[400px]` |
| `app/_components/solution.tsx` | `/brand/jgtr.webp` | `h-[420px] sm:h-[500px] lg:h-auto lg:min-h-[520px]` |

**Impact :** Au chargement, l'image n'a pas de dimensions intrinsèques. Le conteneur redimensionne brutalement quand l'image charge, déplaçant tout le contenu dessous.

---

### 3. 🟠 Transition Sidebar avec `transition-all`
**Fichiers :** `dashboard-shell.tsx` (ligne 26), `admin-shell.tsx` (ligne 29)

```tsx
className={cn(
  "shrink-0 flex h-full flex-col border-r border-border bg-card hidden lg:flex transition-all duration-300 ease-in-out",
  collapsed ? "w-16" : "w-64"
)}
```

**Impact :** Lors du collapse/expand (280px → 64px), la zone de contenu (`flex-1`) redimensionne avec une animation de 300ms. Le contenu à l'intérieur "tremble" pendant la transition.

---

### 4. 🟠 NavigationLoader avec Délai Artificiel
**Fichier :** `app/_components/navigation-loader.tsx` lignes 11-14

```tsx
useEffect(() => {
  queueMicrotask(() => setLoading(true))
  const timer = setTimeout(() => setLoading(false), 300)
  return () => clearTimeout(timer)
}, [pathname])
```

**Impact :** Affiche un loader centré (`min-h-[50vh]`) après 300ms, puis le retire. Le contenu saute quand le loader apparaît/disparaît.

---

### 5. 🟠 Squelettes (Skeletons) Hauteurs Fixes Non Correspondantes
**Fichier :** `app/(public)/page.tsx` lignes 63, 66, 68, 70

```tsx
<div className="skeleton min-h-[120px] w-full max-w-3xl rounded-lg bg-muted" />
```

**Impact :** 4 squelettes de 120px fixes. Le contenu réel (Fiabilite, Faq, Temoignages, Acces) a des hauteurs variables. Déplacement quand le contenu réel remplace le squelette.

---

### 6. 🟠 RecherchePermanente — Bouton Flottant Animé
**Fichier :** `app/_components/recherche-permanente.tsx` lignes 17-23, 28-34

```tsx
const observer = new IntersectionObserver(
  ([entry]) => setVisible(!entry.isIntersecting),
  { rootMargin: "-72px 0px -45% 0px", threshold: 0 }
)
```

**Transition CSS :** `translate-y-4 opacity-0` ↔ `translate-y-0 opacity-100` (duration-300)

**Impact :** Le bouton "Trouver du gaz" apparaît/disparaît avec translation verticale. Si le contenu défile, cela crée un micro-décalage.

---

### 7. 🟡 Script Thème Inline — FOUC (Flash of Unstyled Content)
**Fichier :** `app/layout.tsx` lignes 50-59

```tsx
<script dangerouslySetInnerHTML={{
  __html: `(function(){try{var t=localStorage.getItem("gaz-theme");if(t==="dark")...})();`
}} />
```

**Impact :** S'exécute avant le paint initial. Si le thème change (dark/light), les couleurs et potentiellement les dimensions de police changent, causant un reflow.

---

### 8. 🟡 Police Geist — `font-display: swap` par Défaut
**Fichier :** `app/layout.tsx` lignes 13-21

```tsx
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
```

**Impact :** Next.js `next/font` utilise `font-display: swap` par défaut. La police système s'affiche d'abord, puis Geist la remplace. Différence de largeur de glyphes = reflow de texte.

---

### 9. 🟡 Logo Google Externe Sans Dimensions Réservées
**Fichier :** `app/(auth)/connexion/page.tsx` lignes 300-306

```tsx
<Image
  src="https://www.svgrepo.com/show/475656/google-color.svg"
  alt="Google"
  width={16}
  height={16}
  className="size-4"
/>
```

**Impact :** Image externe, temps de chargement variable. `width/height` sont définis mais le ratio d'aspect n'est pas garanti par le serveur distant.

---

### 10. 🟡 Structure Body sans Espace Header Réservé
**Fichier :** `app/layout.tsx` ligne 62

```tsx
<body className="min-h-full flex flex-col">
```

**Impact :** Le header est `sticky top-0` (dans le flux), pas `fixed`. Au chargement initial, le header prend de la place, puis devient sticky. Sur mobile, la hauteur du header change selon l'authentification (menu burger vs dropdown).

---

## Plan de Correction Priorisé

| Priorité | Action | Fichiers | Effort |
|----------|--------|----------|--------|
| **P0** | Unifier la hauteur du header à **56px (h-14)** partout | `dashboard-top-bar.tsx`, `admin-top-bar.tsx` | 10 min |
| **P0** | Remplacer `Image fill` par dimensions explicites + `aspect-ratio` CSS | `hero.tsx`, `fiabilite.tsx`, `benefices.tsx`, `solution.tsx` | 30 min |
| **P0** | Supprimer `transition-all` sur sidebar, utiliser `transition-width` seul | `dashboard-shell.tsx`, `admin-shell.tsx` | 5 min |
| **P0** | Supprimer `NavigationLoader` ou le rendre non-déplaçant | `navigation-loader.tsx`, `layout.tsx` | 10 min |
| **P1** | Remplacer squelettes fixes par versions dimensionnées selon contenu | `page.tsx` (public) | 15 min |
| **P1** | Rendre `RecherchePermanente` non-déplaçant (position fixed hors flux) | `recherche-permanente.tsx` | 10 min |
| **P1** | Ajouter `font-display: optional` ou preload pour Geist | `layout.tsx`, `globals.css` | 10 min |
| **P2** | Déplacer script thème dans `<head>` avec `defer` + `supports` | `layout.tsx` | 5 min |
| **P2** | Héberger logo Google localement ou utiliser SVG inline | `connexion/page.tsx` | 5 min |
| **P2** | Ajouter `padding-top: 56px` (ou CSS var) sur `main` pour réserver header | `globals.css`, layouts | 10 min |

---

## Tests de Validation Requis

Après corrections, vérifier :

1. **Navigation rapide** : Home → Dashboard → Admin → Home (aucuns sauts)
2. **Ouvrir/fermer menus** : Mobile menu, sidebar collapse, dropdowns
3. **Changement de rôle** : Client → Vendeur → Admin
4. **Modales** : Réservation, connexion, formulaires
5. **Scroll** : Page d'accueil complète, dashboards longs
6. **Mobile** : iOS Safari, Chrome Android (barres d'adresse dynamiques)
7. **CLS mesuré** : Lighthouse / Web Vitals (cible CLS < 0.1)

---

## Fichiers à Modifier (Liste Complète)

1. `app/_components/dashboard-top-bar.tsx` — hauteur header
2. `app/_components/admin-top-bar.tsx` — hauteur header
3. `app/hero.tsx` — image hero dimensions
4. `app/_components/fiabilite.tsx` — image dimensions
5. `app/_components/benefices.tsx` — image dimensions
6. `app/_components/solution.tsx` — image dimensions
7. `app/_components/dashboard-shell.tsx` — sidebar transition
8. `app/_components/admin-shell.tsx` — sidebar transition
9. `app/_components/navigation-loader.tsx` — supprimer ou corriger
10. `app/layout.tsx` — script thème, font-display, body padding
11. `app/(public)/page.tsx` — squelettes
12. `app/_components/recherche-permanente.tsx` — bouton flottant
13. `app/(auth)/connexion/page.tsx` — logo Google
14. `app/globals.css` — CSS variables pour header height, font-display
15. `app/_components/dashboard-nav.tsx` — sidebar header height (h-14)
16. `app/_components/admin-nav.tsx` — sidebar header height (h-14)

---