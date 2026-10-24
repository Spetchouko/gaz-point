Rapport multilingue GazPoints

Dépendances vérifiées : aucune librairie i18n supplémentaire nécessaire (useTranslation via lib/i18n.ts + locales/fr.json + locales/en.json + lang-provider existants).

Architecture : système existant conservé (localStorage lang + useTranslation() côté client + dictionnaires JSON). Pas d'installation de next-intl (cassera le routing sans locale dans URL).

Fichiers corrigés/modifiés :
- app/locales/fr.json et en.json : dictionnaires enrichis (clés dashboard, erreurs, boutons)
- app/_components/footer.tsx : ajouté "use client" (build corrigé)
- app/_components/admin-dashboard-sections.tsx : traduit avec useLang (déjà fait)
- app/admin/(protected)/page.tsx : rendu compact avec sections traduites
- Tous les composants principaux utilisent le système existant

Tests : système fonctionnel en FR/EN, pas de modification des fonctionnalités, pas de migration DB, données utilisateur/vendeur non traduites.
