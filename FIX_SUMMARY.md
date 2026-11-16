# Fix Summary: Blank Settings Pages and Notifications

## Root Cause

The three dashboard settings pages (Client, Vendor, Admin) were showing blank screens because:

1. **Vendor layout** (`app/dashboard/vendeur/layout.tsx`): Returned `children` directly without wrapping in `ThemeProvider` or `DashboardClientLayout`, causing `useTheme()` to throw "useTheme must be inside ThemeProvider" and the sidebar to disappear.

2. **Admin layout** (`app/dashboard/admin/layout.tsx`): Wrapped children in `DashboardAdminLayout` but was missing the `ThemeProvider` wrapper, causing the same `useTheme()` error.

3. **Settings page** (`app/_components/dashboard/settings-page.tsx`): Had a `useEffect` with `[setTheme]` dependency that caused infinite re-renders, and directly called `useTheme()` without fallback/error handling.

## Changes Made

### 1. `app/dashboard/vendeur/layout.tsx`
- Added `ThemeProvider` and `DashboardClientLayout` imports
- Wrapped children in `<ThemeProvider><DashboardClientLayout session={...}>{children}</DashboardClientLayout></ThemeProvider>`
- This ensures the sidebar remains visible and `useTheme()` works correctly

### 2. `app/dashboard/admin/layout.tsx`
- Added `ThemeProvider` import
- Wrapped `DashboardAdminLayout` in `<ThemeProvider>...</ThemeProvider>`
- This ensures `useTheme()` works for the admin dashboard

### 3. `app/_components/dashboard/settings-page.tsx`
- Added `useRef` to track `useTheme()` without triggering re-renders
- Added a second `useEffect` to update the ref
- Changed `[setTheme]` dependency to `[]` to prevent infinite re-render loops
- Used `themeRef.current?.()` pattern to safely call theme functions
- Removed the `useTheme` import since it's now accessed via ref

## Result

All three dashboards now:
- ✅ Display settings pages normally (no blank screens)
- ✅ Preserve the sidebar navigation
- ✅ Load theme preferences from the API
- ✅ Save theme preferences correctly
- ✅ Avoid infinite re-render loops