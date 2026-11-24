# Rationale: Dashboard Harmonization

## Context

The GazPoints application has four dashboard roles, each with its own layout implementation:

1. **Client** (`/dashboard/client`) — Uses `DashboardShell` via `DashboardClientLayout`. Reference implementation. Works well.
2. **Vendor** (`/dashboard/vendeur/*` and `/dashboard/depot/*`) — Uses `DashboardShell` with `role="vendor"`. Two layout entry points (vendeur layout + root layout for depot routes).
3. **Admin** (`/dashboard/admin/*`) — Uses custom `DashboardAdminLayout` (608 lines in `admin-layout-new.tsx`) with `ThemeProvider`, grouped navigation, permission filtering, custom header actions.
4. **Collaborateur** (`/dashboard/collaborateur/*`) — Uses custom `CollaborateurLayout` (449 lines in `collaborateur-layout.tsx`) with similar structure to admin but different modules and permission model.

### Problems Identified

| Issue | Client | Vendor | Admin | Collaborateur |
|-------|--------|--------|-------|---------------|
| Shell component | DashboardShell ✓ | DashboardShell ✓ | Custom (admin-layout-new.tsx) | Custom (collaborateur-layout.tsx) |
| Sidebar position (desktop) | Left ✓ | Left ✓ | Left ✓ | Left ✓ |
| Sidebar position (mobile) | Right drawer ✓ | Right drawer ✓ | Left (no drawer!) | Right drawer ✓ |
| Collapsed sidebar | ✓ | ✓ | ✓ | ✓ |
| Grouped navigation | No | No | Yes | Yes |
| Permission filtering | No | No | Yes | Yes |
| Header actions (desktop) | Primary/Secondary | Primary/Secondary | Custom buttons | None |
| ThemeProvider | Root (inherited) | Root (inherited) | Local wrapper | Local wrapper |
| Footer | Shared ✓ | Shared ✓ | Shared ✓ | Shared ✓ |
| Scroll to top | Shared ✓ | Shared ✓ | Shared ✓ | Shared ✓ |
| Content padding | `container mx-auto px-4 py-6` | `container mx-auto px-4 py-6` | Custom `admin-workarea__padding` | `container mx-auto px-4 py-6` |

Key inconsistencies:
- Admin sidebar doesn't become a drawer on mobile (stays left, pushes content)
- Collaborateur has right drawer on mobile but admin doesn't
- Admin uses custom CSS classes (`admin-workarea__main`, `admin-workarea__padding`) instead of shared container
- Two large duplicate layout files (~1057 lines total) with 80% similar code
- ThemeProvider duplicated in admin and collaborateur layout wrappers

## Options Considered

### Option A: Single Unified DashboardShell (CHOSEN)
Extend existing `DashboardShell` to support all four roles with optional grouped navigation and permission filtering.

**Pros:**
- Maximum code reuse (~1000 lines removed)
- Single source of truth for shell behavior
- Consistent UX guaranteed
- Easier to add new roles
- Smaller bundle

**Cons:**
- More complex `DashboardShell` component
- Admin header actions need custom prop
- Migration risk for admin/collaborateur

### Option B: Separate But Harmonized Layouts
Keep `admin-layout-new.tsx` and `collaborateur-layout.tsx` but refactor them to use identical patterns, shared sub-components, and consistent CSS.

**Pros:**
- Lower migration risk
- Admin-specific logic stays isolated

**Cons:**
- Still duplicate code
- Drift likely over time
- Bug fixes must be applied in multiple places
- Doesn't solve ThemeProvider duplication

### Option C: Composition-Based Shell
Create a `DashboardShell` that only provides the outer structure (sidebar + header + footer + main), and each role provides its own `SidebarNav` and `HeaderActions` components.

**Pros:**
- Clean separation of concerns
- Maximum flexibility per role

**Cons:**
- More components to maintain
- Still need to ensure consistent behavior across composed parts
- Over-engineering for current needs

## Decision: Option A with Composition Elements

Extend `DashboardShell` with optional props:
- `navGroups?: NavGroup[]` — for admin/collaborateur grouped navigation
- `permissions?: Set<string>` — for permission filtering
- `headerActions?: React.ReactNode` — for admin custom header buttons

This keeps the core shell unified while allowing role-specific extensions through props rather than separate components.

## References

- Current `DashboardShell` implementation: `app/_components/dashboard/dashboard-shell.tsx`
- Current admin layout: `app/_components/dashboard/admin-layout-new.tsx`
- Current collaborateur layout: `app/_components/dashboard/collaborateur-layout.tsx`
- Navigation config: `app/_components/dashboard/dashboard-nav.ts`
- Root layout: `app/layout.tsx`
- Client layout wrapper: `app/dashboard/layout.tsx`
- Vendor layout: `app/dashboard/vendeur/layout.tsx`
- Admin layout wrapper: `app/dashboard/admin/layout.tsx`
- Collaborateur layout wrapper: `app/dashboard/collaborateur/layout.tsx`