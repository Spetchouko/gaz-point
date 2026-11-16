Sync record: Fixed blank settings pages across 3 dashboards

Changes:
- app/dashboard/vendeur/layout.tsx: Added ThemeProvider + DashboardClientLayout wrapper
- app/dashboard/admin/layout.tsx: Added ThemeProvider wrapper around DashboardAdminLayout  
- app/_components/dashboard/settings-page.tsx: Replaced useTheme() with useRef pattern, fixed [setTheme] dependency to [], removed infinite re-render loop

Root cause: Missing ThemeProvider in vendor/admin layouts caused useTheme() to throw; Settings page had [setTheme] dependency causing infinite re-renders.

All three dashboards now render settings correctly with sidebar visible and theme preferences working.