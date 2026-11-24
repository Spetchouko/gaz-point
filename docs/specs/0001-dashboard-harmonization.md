# Dashboard Harmonization — Unified Shell for Client, Vendor, Admin, Collaborateur

**Status:** Accepted
**Date:** 2026-11-23
**Mode:** CROSS-CUTTING

---

## Summary

Unify the four dashboard shells (client, vendor, admin, collaborateur) into a single `DashboardShell` component with role-based configuration. The client dashboard is the reference implementation; admin and collaborateur layouts will be refactored to use the same shell with extensions for grouped navigation and permissions. ThemeProvider moves to root layout.

---

## Requirements

### Functional

- **AC-1** Single `DashboardShell` component serves all four roles (`client`, `vendor`, `admin`, `collaborateur`)
- **AC-2** Sidebar behavior identical across roles: left on desktop (≥1024px), right drawer on mobile (<1024px)
- **AC-3** Sidebar supports collapsed state (icon-only, 64px) and expanded state (256px) for all roles
- **AC-4** Top header bar identical: logo + home link, quick actions, user avatar/menu, notifications bell, logout
- **AC-5** Mobile header shows hamburger menu to open sidebar drawer
- **AC-6** Footer (`DashboardFooter`) and scroll-to-top (`ScrollToTop`) present on all dashboards
- **AC-7** Content area padding consistent: `container mx-auto px-4 py-6 sm:px-6 lg:px-8`
- **AC-8** Navigation items defined centrally per role, with active state highlighting
- **AC-9** Admin and collaborateur support **grouped navigation** (sections with labels) with permission filtering
- **AC-10** Vendor role supports primary/secondary action buttons in desktop header (Disponibilités / Réservations)
- **AC-11** Client role supports primary/secondary action buttons in desktop header (Recherche / Réservations)
- **AC-12** Notifications badge shows unread count in sidebar and header for all roles
- **AC-13** Profile link in sidebar and header navigates to role-specific profile page
- **AC-14** Logout works identically across all roles
- **AC-15** ThemeProvider moved to root layout (`app/layout.tsx`), single instance for entire app

### Non-functional

- **AC-16** No duplicate layout components (`admin-layout-new.tsx`, `collaborateur-layout.tsx` removed)
- **AC-17** TypeScript compiles without errors (`pnpm build` succeeds)
- **AC-18** ESLint passes with no new warnings
- **AC-19** Responsive behavior tested at 320px, 768px, 1024px, 1440px breakpoints
- **AC-20** All existing pages render correctly within new shell (no broken routes)

---

## Decision

### Unified Architecture

```
app/
├── _components/
│   └── dashboard/
│       ├── dashboard-shell.tsx          # SINGLE unified shell (extended)
│       ├── dashboard-nav.ts             # Navigation config per role (extended)
│       ├── dashboard-footer.tsx         # Shared footer
│       ├── dashboard-quick-actions.tsx  # Shared quick actions
│       ├── scroll-to-top.tsx            # Shared scroll button
│       ├── client-layout.tsx            # Thin wrapper for client (kept)
│       └── admin/                       # Admin UI components (kept)
│           ├── AdminCard.tsx
│           ├── AdminStatCard.tsx
│           ├── AdminTable.tsx
│           ├── AdminPageHeader.tsx
│           └── AdminBadge.tsx
├── layout.tsx                           # Root layout: ThemeProvider HERE
```

### Role Configuration

| Role | Nav Items | Grouped Nav | Primary Action | Secondary Action | Profile Href | Notifications Href | Home Href |
|------|-----------|-------------|----------------|------------------|--------------|-------------------|-----------|
| client | `CLIENT_NAV_ITEMS` | No | Recherche → `/resultats-recherche` | Réservations → `/dashboard/reservations` | `/dashboard/profil` | `/dashboard/notifications` | `/dashboard/client` |
| vendor | `VENDOR_NAV_ITEMS` | No | Disponibilités → `/dashboard/depot/disponibilites` | Réservations → `/dashboard/depot/reservations` | `/dashboard/vendeur/profil` | `/dashboard/vendeur/notifications` | `/dashboard/vendeur` |
| admin | `ADMIN_NAV_GROUPS` | **Yes** | Dashboard → `/dashboard/admin` | Rapports → `/dashboard/admin/analytics` | `/dashboard/admin/profil` | `/dashboard/admin/notifications` | `/dashboard/admin` |
| collaborateur | `COLLABORATEUR_MODULES` | **Yes** | Dashboard → `/dashboard/collaborateur` | (none) | `/dashboard/admin/profil` | `/dashboard/admin/notifications` | `/dashboard/collaborateur` |

### DashboardShell Props Extension

```tsx
type DashboardShellRole = "client" | "vendor" | "admin" | "collaborateur";

interface DashboardShellProps {
  children: React.ReactNode;
  role: DashboardShellRole;
  session?: DashboardUser | null;
  status?: "loading" | "authenticated" | "unauthenticated";
  // NEW: for admin/collaborateur grouped navigation
  navGroups?: NavGroup[];           // optional grouped navigation
  permissions?: Set<string>;        // for permission filtering
  // NEW: custom header actions for admin (Utilisateurs, Vendeurs buttons)
  headerActions?: React.ReactNode;
}
```

### Navigation Configuration (`dashboard-nav.ts`)

Extend with admin/collaborateur nav groups:

```ts
export type DashboardNavGroup = {
  groupLabel: string;
  items: Array<{
    key: string;
    href: string;
    label: string;
    icon: LucideIcon;
    requiredPermission?: string | null;
  }>;
};

export const ADMIN_NAV_GROUPS: DashboardNavGroup[] = [ ... ];  // from admin-layout-new.tsx
export const COLLABORATEUR_NAV_GROUPS: DashboardNavGroup[] = [ ... ];  // from collaborateur-layout.tsx

export function getDashboardNavGroups(role: DashboardShellRole): DashboardNavGroup[] | null {
  switch (role) {
    case "admin": return ADMIN_NAV_GROUPS;
    case "collaborateur": return COLLABORATEUR_NAV_GROUPS;
    default: return null;
  }
}
```

### Sidebar Rendering Logic

```
if (navGroups) {
  // Render grouped navigation (admin/collaborateur)
  navGroups.map(group => (
    <section>
      <GroupLabel>{group.groupLabel}</GroupLabel>
      group.items
        .filter(item => !item.requiredPermission || permissions.has(item.requiredPermission))
        .map(item => <NavLink ... />)
    </section>
  ))
} else {
  // Render flat navigation (client/vendor)
  navItems.map(item => <NavLink ... />)
}
```

### Header Actions (Admin Only)

Admin desktop header shows additional action buttons (Utilisateurs, Vendeurs). Pass via `headerActions` prop.

### ThemeProvider

Move from `admin-layout-new.tsx` and `collaborateur-layout.tsx` to `app/layout.tsx`:

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/app/_components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

Remove `ThemeProvider` wrapper from admin and collaborateur layout wrappers.

### Layout Wrappers Simplification

**Client** (`app/dashboard/layout.tsx`): Keep as-is, uses `DashboardClientLayout` → `DashboardShell`

**Vendor** (`app/dashboard/vendeur/layout.tsx`): Simplify to use `DashboardShell` directly (already does)

**Admin** (`app/dashboard/admin/layout.tsx`): Replace `DashboardAdminLayout` with `DashboardShell` + `navGroups` + `permissions` + `headerActions`

**Collaborateur** (`app/dashboard/collaborateur/layout.tsx`): Replace `CollaborateurLayout` with `DashboardShell` + `navGroups` + `permissions`

### Files to Remove

- `app/_components/dashboard/admin-layout-new.tsx` (608 lines)
- `app/_components/dashboard/collaborateur-layout.tsx` (449 lines)
- `app/_components/dashboard/admin-sidebar-context.tsx` (no longer needed)

### Files to Modify

- `app/_components/dashboard/dashboard-shell.tsx` — extend with grouped nav, headerActions, role="admin|collaborateur"
- `app/_components/dashboard/dashboard-nav.ts` — add nav groups, getDashboardNavGroups
- `app/_components/dashboard/client-layout.tsx` — keep (thin wrapper)
- `app/dashboard/admin/layout.tsx` — rewrite to use DashboardShell
- `app/dashboard/collaborateur/layout.tsx` — rewrite to use DashboardShell
- `app/layout.tsx` — add ThemeProvider

---

## Build Plan

### Phase 1: Extend DashboardShell (core)
- [ ] Add `navGroups`, `permissions`, `headerActions` props to `DashboardShell`
- [ ] Implement grouped navigation rendering in sidebar
- [ ] Implement permission filtering for nav items
- [ ] Add admin header actions rendering in desktop header
- [ ] Ensure sidebar positioning: left on desktop, right drawer on mobile for ALL roles
- [ ] Verify collapsed/expanded behavior works with grouped nav

### Phase 2: Update Navigation Config
- [ ] Move `ADMIN_NAV_GROUPS` from `admin-layout-new.tsx` to `dashboard-nav.ts`
- [ ] Move `COLLABORATEUR_MODULES` from `collaborateur-layout.tsx` to `dashboard-nav.ts`
- [ ] Add `getDashboardNavGroups(role)` function
- [ ] Export types for grouped nav

### Phase 3: Move ThemeProvider to Root
- [ ] Add `ThemeProvider` to `app/layout.tsx`
- [ ] Remove `ThemeProvider` from `app/dashboard/admin/layout.tsx`
- [ ] Remove `ThemeProvider` from `app/dashboard/collaborateur/layout.tsx`

### Phase 4: Rewrite Admin Layout
- [ ] Replace `DashboardAdminLayout` import with `DashboardShell`
- [ ] Pass `navGroups={ADMIN_NAV_GROUPS}`, `permissions`, `headerActions={<AdminHeaderActions />}`
- [ ] Keep permission loading logic (fetch `/api/user/permissions`)
- [ ] Keep session loading/redirect logic
- [ ] Remove `admin-layout-new.tsx` and `admin-sidebar-context.tsx`

### Phase 5: Rewrite Collaborateur Layout
- [ ] Replace `CollaborateurLayout` import with `DashboardShell`
- [ ] Pass `navGroups={COLLABORATEUR_NAV_GROUPS}`, `permissions`
- [ ] Keep permission loading logic
- [ ] Keep session loading/redirect logic
- [ ] Remove `collaborateur-layout.tsx`

### Phase 6: Verify & Test
- [ ] Run `pnpm build` — fix all TypeScript errors
- [ ] Run `pnpm lint` — fix all ESLint warnings
- [ ] Test client dashboard: login, navigation, responsive, all pages
- [ ] Test vendor dashboard: login, navigation, responsive, all pages (including /dashboard/depot/*)
- [ ] Test admin dashboard: login, navigation, permissions, responsive, all pages
- [ ] Test collaborateur dashboard: login, navigation, permissions, responsive
- [ ] Verify notifications badge works in all roles
- [ ] Verify profile links go to correct pages
- [ ] Verify logout works in all roles
- [ ] Verify sidebar collapse/expand works in all roles
- [ ] Verify mobile drawer opens/closes correctly in all roles

---

## Consequences

### Positive
- Single source of truth for dashboard shell behavior
- Consistent UX across all roles
- Easier maintenance: bug fixes in one place benefit all dashboards
- Smaller bundle size (removed ~1000 lines of duplicate layout code)
- New roles automatically get consistent shell

### Negative
- Admin/collaborateur layouts need careful migration to preserve permission filtering
- Header actions for admin need custom prop (slight API complexity)
- Risk of regression during migration (mitigated by phased testing)

### Risks
- **Medium**: Admin permission loading is async; shell must handle loading state gracefully
- **Low**: Collaborateur uses different avatar logic (local file upload); ensure preserved
- **Low**: Mobile sidebar overlay z-index conflicts (test thoroughly)

---

## Follow-up

- [ ] Add visual regression tests for dashboard shells
- [ ] Document DashboardShell API in `docs/components/dashboard-shell.md`
- [ ] Consider extracting `useDashboardShell` hook for complex logic
- [ ] Evaluate if `DashboardQuickActions` needs role-specific items

---

## Rationale

See `rationale.md` for detailed context, options considered, and references.