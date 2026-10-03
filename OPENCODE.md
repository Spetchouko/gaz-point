@AGENTS.md

## Conventions
- Toujours utiliser les composants Shadcn de @/components/ui. Ne jamais recréer un composant qui existe déjà.
- Toujours utiliser les icônes de lucide-react.
- Mettre les composants de section dans app/_components.
- N'ajouter "use client" QUE dans les composants vraiments interactifs (état, clics, événements). Par défaut, garder côté serveur.