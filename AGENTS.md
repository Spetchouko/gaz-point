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

## RULES TO FOLLOW
1. Inspect Before Changing
Always inspect the existing project structure, relevant files, routes, components, database schema, authentication, and installed dependencies before making changes.
Read and follow the applicable project instructions in AGENTS.md, OPENCODE.md, and other relevant instruction files.
Reuse existing components, utilities, libraries, and established coding patterns whenever possible.
Never assume a feature is missing before checking the current implementation.
2. Preserve the Existing Architecture
Respect the existing Next.js, React, TypeScript, UI component, and Neon database architecture.
Do not replace existing technologies or introduce duplicate systems without a demonstrated technical need.
Do not overwrite working features or modify unrelated pages.
Never reset, drop, or destructively modify production database tables.
Use safe, reviewed, backward-compatible database migrations when required.
3. Security and Authorization
Enforce authentication and authorization on the server for every protected operation.
Never rely on hidden UI elements or client-provided roles as security controls.
Apply least-privilege permissions to administrators, collaborators, vendors, and users.
Prevent privilege escalation and unauthorized access to another user's or vendor's data.
Never expose secrets, database credentials, private tokens, or privileged server operations to the client.
Validate and sanitize user input on the server.
4. Functional Implementation
Every button, form, filter, search field, export action, and navigation link must perform its intended function.
Persist changes in the existing database where appropriate.
Handle loading, empty, success, and error states clearly.
Respect existing business rules, including immediate vendor publication without mandatory administrator approval.
Ensure administrative moderation does not unnecessarily interrupt legitimate vendor operations.
5. UI and Responsive Design
Follow the existing Gaspo visual identity and established component conventions.
Prefer existing Shadcn UI components from @/components/ui where appropriate.
Use Lucide React icons when needed.
Do not recreate components that already exist.
Ensure layouts work correctly on desktop, tablet, and mobile.
Avoid unnecessary redesigns outside the scope of the requested task.
6. Testing and Validation
After implementing a feature, run the relevant tests and available type checks and lint checks.
Test the actual user workflow, data persistence, permissions, and error handling.
Verify important changes in a real browser when browser testing is available.
Fix regressions introduced by the implementation.
Never claim that tests or browser validation passed unless they were actually executed successfully.
7. Task Execution
For substantial changes, first inspect the project and provide a concise implementation plan.
Implement changes incrementally, prioritizing the requested functionality.
Avoid unnecessary dependencies, duplicate code, speculative features, and unrelated refactoring.
Report the files changed, database changes, tests executed, and any unresolved issues.
Do not stop at a visual mockup when the requested feature requires real backend functionality.
8. Completion Standard

A task is complete only when its intended functionality is implemented, security requirements are respected, relevant tests have been executed, and the result has been verified to the extent supported by the available environment.


## Gotchas
- Next.js 16 has breaking changes — check `node_modules/next/dist/docs/` before assuming APIs
- `SheetTrigger` must be imported from `@/components/ui/sheet` (defined there, not from @base-ui/react)
- WSL paths: dev server may fail with UNC paths (`\\wsl.localhost\...`) — run from Windows path or native Linux