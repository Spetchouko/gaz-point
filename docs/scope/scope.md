# Scope: GazPoints

Application web de mise en relation entre vendeurs de gaz et clients, avec tableaux de bord séparés pour les clients, les vendeurs et l'administration.

**Build approach:** Tracer Bullet (tranches fines de bout en bout, de la route à la base, puis épaississement).
**Workflow:** GA (vérification, tests, revue par un nouveau modèle puis documentation après le développement). Le niveau de rigueur par défaut du projet.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Reconstruction du dashboard vendeur | Slice 1 | in-progress |

## Slice 1: Espace vendeur

### 1. Reconstruction du dashboard vendeur · in-progress

Remplacer l'ancienne interface vendeur par sept rubriques neuves, avec la navigation du client réutilisée par un shell partagé et paramétré par rôle.
**Done when:** les sept rubriques sont fonctionnelles, les données sont filtrées sur le vendeur connecté, les failles connues sont corrigées, les trois formats d'écran sont vérifiés, le build réussit et les dashboards client et admin restent inchangés.
**Validation du 2026-11-21 :** build et suite de tests réussis, lint et typecheck ciblés propres, contrôle HTTP des routes effectué. Le rendu visuel authentifié sur desktop/tablette/mobile et les deux thèmes reste à vérifier avec un navigateur et une session vendeur.
- [x] Design it (spec): `/architect reconstruction du dashboard vendeur`
- [x] Build it: `/develop reconstruction du dashboard vendeur`
   - [x] Sécurité et shell partagé : propriété serveur, corrections des routes, coquille unique et navigation vendeur (AC-1 à AC-4, AC-15, AC-17)
   - [x] Routes vendeur et lectures serveur : dépôt, disponibilités, statistiques réelles et historique d'activité (AC-4 à AC-8)
   - [x] Sept rubriques et états d'interface : pages, squelettes, états vides, erreurs et toasts (AC-5 à AC-13)
   - [x] Nettoyage et validation finale : retrait des doublons, build et non régression (AC-14, AC-16, AC-18 à AC-20)
- [ ] Verify it: `/check verify reconstruction du dashboard vendeur` (contrôle HTTP fait ; visuel authentifié desktop/tablette/mobile restant)
- [x] Test it: suite `pnpm test` exécutée avec succès
- [ ] Review it (fresh model): `/check review reconstruction du dashboard vendeur`
- [ ] Document it: `/document reconstruction du dashboard vendeur`
Spec [0004](../specs/0004-reconstruction-dashboard-vendeur/index.md)

## Deferred

Out of scope for the current build pass, kept so the plan stays honest.
- **Corrections des coquilles admin et collaborateur** : classes littérales, repli cassé, marge fixe et badge fictif · from spec 0004
- **Filtrage des avis administratifs** : conditions combinées avec `or` au lieu de `and` · from spec 0004

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Skills locate it by that suffix, never by an exact label.

**Feature lifecycle**: `planned` → `in-progress` → `done`, plus `existing` for work that predates the workflow and `dropped` for de-scoped work kept for history.

- **Next step** = the first unticked box.
- **Atomic build tasks live in the spec's `## Build plan`, not here**.
- **Workflow** is the project default after `/develop`: `GA` runs verify, test, review and documentation.
- **Pointer line** carries the spec link once `/architect` has captured it, and the code path once `/develop` has built it.
