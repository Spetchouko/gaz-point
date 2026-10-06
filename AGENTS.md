# gaz-point — Next.js 16 + React 19 + Tailwind v4

## Commands
| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Typecheck | `npx tsc --noEmit` |

## Key facts
- **Package manager**: pnpm (v12.8.1) — use `pnpm` not `npm`
- **Path aliases**: `@/*` → `./*` (tsconfig.json)
- **UI library**: shadcn/ui with "base-nova" style, components in `@/components/ui`
- **Classnames**: `cn` utility from `@/lib/utils`
- **Icons**: lucide-react
- **Base UI**: @base-ui/react primitives (Dialog, etc.)
- **ESLint**: flat config extending `eslint-config-next` (core-web-vitals + typescript)

## Project structure
```
app/           # Next.js App Router (pages, layout, globals.css)
components/    # Shared components (header.tsx, ui/*)
lib/           # Utilities (utils.ts → cn helper)
```

## Conventions
- Always use Shadcn components from `@/components/ui` — never recreate existing components
- Always use icons from `lucide-react`
- Mettre les composants de section dans app/_components.
- N'ajouter "use client" QUE dans les composants vraiments interactifs (état, clics, événements). Par défaut, garder côté serveur.
- Tout ce qui touche à la base de données (connexion, schémas de
tables) va dans le dossier db/.
- Utiliser l'objet "db" exporté depuis db/index.ts pour parler à la
base. Ne jamais recréer une connexion.
- L'auth est gérée par Better Auth :fichier central lib/auth.ts, client lib/auth-client.ts.
- Peut modifier à la main db/schema.ts.
- Pour inscrire ou connecter un utilisateur, toujours passer par notre client d'authentification.
- Tous les secrets vont dans .env.

## Gotchas
- Next.js 16 has breaking changes — check `node_modules/next/dist/docs/` before assuming APIs
- `SheetTrigger` must be imported from `@/components/ui/sheet` (defined there, not from @base-ui/react)
- WSL paths: dev server may fail with UNC paths (`\\wsl.localhost\...`) — run from Windows path or native Linux