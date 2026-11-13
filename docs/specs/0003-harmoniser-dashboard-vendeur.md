# Harmonisation du Dashboard Vendeur avec le Dashboard Client

**Status**: Proposed
**Date**: 2026-11-10
**Mode**: ENHANCEMENT

## Summary

Appliquer la même architecture, les mêmes conventions et la même simplicité du dashboard client (qui fonctionne naturellement bien) au dashboard vendeur. Réutiliser les composants, layouts, mécanismes de navigation, d'authentification et de chargement de données existants. La seule différence doit concerner les informations et fonctionnalités propres au vendeur.

## Requirements

- **REQ-1** : Layout unifié — Le dashboard vendeur utilise `DashboardShell` (via `ClientLayout`/`VendorLayout` unifiés) exactement comme le dashboard client
- **REQ-2** : Navigation unifiée — La navigation vendeur utilise `getDashboardNavSections("vendor")` centralisée, plus de navigation en dur dans `DashboardVendeur`
- **REQ-3** : Authentification unifiée — Même pattern `requireUser()` + vérification rôle côté serveur, pas de `requirePro()` séparé
- **REQ-4** : Chargement données unifié — Pattern serveur simple : page RSC récupère données → passe props aux composants client, pas de logique complexe dans la page
- **REQ-5** : Gestion session unifiée — Même mécanisme `authClient.useSession()` dans `DashboardNav`/`DashboardTopBar`, pas de `ToastProvider` ajouté dans `VendorLayout`
- **REQ-6** : Composants partagés — `DashboardClient` et `DashboardVendeur` suivent le même pattern : composants client simples, logique métier dans pages RSC
- **REQ-7** : Conservation fonctionnalités vendeur — Point de vente, bouteilles, disponibilités, réservations, profil, services, onboarding
- **REQ-8** : Actualisation page sans perte session — Même comportement que client (session persistée, pas de redirection intempestive)
- **REQ-9** : Gestion erreurs cohérente — États loading/error/empty uniformes avec le client
- **REQ-10** : Build/lint/typecheck passent sans régression sur les trois dashboards (client, vendeur, admin)

## Decision

### Architecture cible (alignée sur le client)

```
app/dashboard/page.tsx (client)
  → requireUser()
  → ClientLayout
    → DashboardShell(role="client")
      → DashboardNav + DashboardTopBar (nav centralisée)
      → DashboardClient (composant client simple, props only)

app/dashboard/vendeur/page.tsx (vendeur)
  → requireUser() + vérification role === "vendor" + redirect si admin/collaborateur
  → VendorLayout (unifié avec ClientLayout)
    → DashboardShell(role="vendor")
      → DashboardNav + DashboardTopBar (nav centralisée via getDashboardNavSections)
      → DashboardVendeur (composant client simple, props only)
```

### Changements précis

#### 1. Unifier les layouts (`ClientLayout` ↔ `VendorLayout`)

**Fichier : `app/_components/vendor-layout.tsx`**
- Supprimer `ToastProvider` (le client n'en a pas, les toasts sont gérés par `sonner` globalement via `Toaster` dans un provider racine si nécessaire)
- Aligner la signature sur `ClientLayout` : `vendorName`/`vendorEmail` → `clientName`/`clientEmail` (ou garder noms vendeur mais même structure)
- Les deux layouts deviennent de simples wrappers autour de `DashboardShell`

#### 2. Simplifier la page principale vendeur (`app/dashboard/vendeur/page.tsx`)

**Problème actuel** : 200+ lignes de logique DB complexe, Maps non sérialisables, calculs multiples
**Solution** : Extraire la logique dans des fonctions utilitaires, garder la page RSC simple comme `app/dashboard/page.tsx`

```typescript
// Nouveau pattern (aligné sur client)
export default async function DashboardVendeurPage() {
  const user = await requireUser()
  const role = user.role ?? "client"
  
  if (role === "admin" || role === "collaborateur") redirect("/admin")
  if (role !== "vendor") redirect("/dashboard")
  
  const data = await getVendorDashboardData(user.id) // fonction utilitaire
  
  return (
    <VendorLayout vendorName={user.name} vendorEmail={user.email}>
      <DashboardVendeur {...data} />
    </VendorLayout>
  )
}
```

#### 3. Nettoyer `DashboardVendeur` composant client

**Problème actuel** : 500+ lignes, état local complexe, modales intégrées, navigation en dur
**Solution** : Composant présentational simple comme `DashboardClient`
- Props only (pas de `useState` pour données serveur)
- Modales extraites en composants séparés (`VendorOnboardingModal`, `PointDeVenteModal`, etc.)
- Navigation via `DashboardNav` centralisée (supprimer les boutons de navigation en bas du composant)
- Actions via Server Actions passées en props

#### 4. Unifier la vérification de rôle

**Actuel** : `requirePro()` dans `lib/session.ts` (vérifie vendor/admin/collaborateur)
**Cible** : Utiliser `requireUser()` + vérification inline comme le client
- `app/dashboard/page.tsx` ligne 21-32 : pattern de référence
- Appliquer le même pattern à toutes les pages vendeur

#### 5. Nettoyer les pages vendeur secondaires

Chaque page (`points-de-vente`, `disponibilites`, `mes-bouteilles`, `mes-services`, `reservations`, `profil`, `espace-pro`) :
- Utiliser `requireUser()` + vérification role
- Même pattern de layout : `VendorLayout` → `DashboardShell`
- Données récupérées dans la page RSC, passées aux composants client
- Composants client simples (présentational + actions via Server Actions)

#### 6. Supprimer `ToastProvider` de `VendorLayout`

- `sonner` fonctionne sans provider explicite (utilise un portal global)
- Si toasts nécessaires, ajouter `Toaster` global dans `app/layout.tsx` (une fois pour tout le projet)

#### 7. Centraliser la navigation vendeur

- `dashboard-nav-items.ts` : `getVendorNavSections()` déjà existe et est utilisé par `DashboardNav`
- Supprimer la navigation en dur dans `DashboardVendeur` (lignes 195-223 et 418-497)
- Le sidebar mobile/desktop via `DashboardTopBar`/`DashboardNav` suffit

## Build plan

### Phase 1 : Layout et navigation unifiés
1. Modifier `app/_components/vendor-layout.tsx` — retirer `ToastProvider`, aligner sur `ClientLayout`
2. Vérifier `app/_components/client-layout.tsx` — structure de référence
3. Modifier `app/_components/dashboard-nav-items.ts` — vérifier `getVendorNavSections()` complet

### Phase 2 : Page principale vendeur simplifiée
4. Créer `lib/vendor-dashboard-data.ts` — fonctions utilitaires extraction données (copier pattern `getVendorDashboardData`)
5. Réécrire `app/dashboard/vendeur/page.tsx` — pattern aligné sur `app/dashboard/page.tsx`
6. Simplifier `app/_components/dashboard-vendeur.tsx` — composant présentational, props only

### Phase 3 : Pages vendeur secondaires
7. `app/dashboard/vendeur/points-de-vente/page.tsx` — aligner sur pattern unifié
8. `app/dashboard/vendeur/disponibilites/page.tsx` — aligner sur pattern unifié
9. `app/dashboard/vendeur/mes-bouteilles/page.tsx` — aligner sur pattern unifié
10. `app/dashboard/vendeur/mes-services/page.tsx` — aligner sur pattern unifié
11. `app/dashboard/vendeur/reservations/page.tsx` — aligner sur pattern unifié
12. `app/dashboard/vendeur/profil/page.tsx` — aligner sur pattern unifié
13. `app/dashboard/vendeur/espace-pro/page.tsx` — aligner sur pattern unifié

### Phase 4 : Composants client vendeur
14. Extraire modales de `dashboard-vendeur.tsx` vers composants dédiés (`app/_components/vendor-onboarding-modal.tsx` existe déjà, vérifier)
15. Nettoyer `dashboard-vendeur.tsx` — retirer navigation en dur, état local complexe
16. Vérifier `PointsDeVenteClient`, `DisponibilitesClient`, `MesReservationsVendeur` — pattern cohérent

### Phase 5 : Session et auth
17. Vérifier `lib/session.ts` — `requireUser()` pattern de référence
18. Appliquer `requireUser()` + vérification role inline sur toutes les pages vendeur
19. Supprimer usage de `requirePro()` dans les pages vendeur

### Phase 6 : Validation
20. `pnpm typecheck` — zéro erreur
21. `pnpm lint` — zéro erreur (ou warnings acceptables)
22. `pnpm build` — build production réussi
22. Test manuel : connexion vendeur → dashboard → actualisation (F5) → navigation → fonctionnalités

## Consequences

### Positif
- Dashboard vendeur aussi simple, fiable et maintenable que le client
- Code partagé maximal, duplication minimale
- Navigation, auth, session, données : un seul pattern à maintenir
- Actualisation page (F5) fonctionne sans perte de session (problème actuel résolu)
- Onboarding vendeur, modales, actions : même robustesse que client

### Risque
- Migration progressive : certaines pages vendeur ont une logique complexe (ex: `disponibilites` avec `pointId` query param) — tester chaque page après modification
- `ToastProvider` retiré : vérifier que les toasts `sonner` fonctionnent encore (ils devraient, `sonner` gère son propre portal)
- Pages avec `searchParams` (ex: `disponibilites`) — garder le pattern `async function Page({ searchParams })` Next.js 16

### Migration
- Phase par phase, page par page
- Commencer par la page principale (`/dashboard/vendeur`) qui est la plus complexe
- Garder `git` propre : commit par phase

## Follow-up

- Vérifier les trois dashboards après build : client (`/dashboard`), vendeur (`/dashboard/vendeur`), admin (`/admin`)
- Confirmer actualisation page (F5) sur chaque dashboard sans redirection intempestive
- Documenter la convention unifiée dans `AGENTS.md` si pas déjà fait
- Supprimer `requirePro()` de `lib/session.ts` si plus utilisé nulle part (vérifier admin/collaborateur d'abord)

---

## Rationale

Le dashboard client fonctionne "naturellement bien" : architecture simple, navigation centralisée, auth cohérente, données chargées côté serveur, composants clients présentational. Le dashboard vendeur a divergé avec du code complexe dans les pages RSC, des composants clients surchargés, une navigation dupliquée, et un layout différent (`ToastProvider`). Cette spec aligne le vendeur sur le client en réutilisant exactement la même méthodologie.