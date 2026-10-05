@AGENTS.md

## Conventions
- Toujours utiliser les composants Shadcn de @/components/ui. Ne jamais recréer un composant qui existe déjà.
- Toujours utiliser les icônes de lucide-react.
- Mettre les composants de section dans app/_components.
- N'ajouter "use client" QUE dans les composants vraiments interactifs (état, clics, événements). Par défaut, garder côté serveur.
- Tout ce qui touche à la base de données (connexion, schémas de
tables) va dans le dossier db/.
- Utiliser l'objet "db" exporté depuis db/index.ts pour parler à la
base. Ne jamais recréer une connexion.