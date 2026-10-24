Rapport lisibilité mode clair / sombre

Fichiers corrigés :
- app/_components/storytelling.tsx : bg-white -> bg-card (carte Constat)
- app/_components/faq.tsx : bg-white -> bg-card (FAQ)
- app/_components/acces.tsx : bg-white -> bg-card (2 cartes)
- app/_components/equipe.tsx : bg-white -> bg-card (rôle fondation)
- app/_components/temoignages.tsx : bg-white -> bg-card (icônes boutons)
- app/_components/solution.tsx : conservé bg-white (icône sur fond blanc intentionnel, texte text-primary lisible)

Tests : pas de régression visuelle, contraste suffisant en mode clair et sombre, pas d'installation supplémentaire, pas de modification du contenu ou des fonctionnalités.
