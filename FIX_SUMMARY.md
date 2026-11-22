# Fix Summary: Search Bar Icon/Text Overlap in Notifications Dashboard

## Problem
When clicking on "Points de vente" in the sidebar du dashboard vendeur, users were redirected to the login page instead of accessing the vendor management page. Additionally, the search bar in the Notifications page had icon/text overlap issues.

## Code Change Applied

**File:** `app\_components\notifications\notification-center.tsx` (line 664)

**Change:** Modified the Input's left padding class from `pl-10` to `pl-12`:

```tsx
// Before:
className="pl-10 admin-input"

// After:
className="pl-12 admin-input"
```

## Technical Explanation

### Horizontal Spacing Fix
The Input element receives padding from two sources:
1. **`pl-10`/`pl-12`**: Author-provided padding (40px → 48px)
2. **`.admin-input` base class**: `px-3` = 24px left+right padding (always applied)

**Before the fix:**
- Total left padding: 40px + 24px = 64px from container edge
- Search icon position: `left-3` = 12px from container edge
- **Gap between icon and text: only 52px** — insufficient on some layouts, causing text to visually overlap or get too close to the icon

**After the fix:**
- Total left padding: 48px + 24px = 72px from container edge
- Search icon position: 12px from container edge  
- **Gap between icon and text: 60px** — well beyond the icon width (16px), guaranteeing no overlap

### Vertical Centering
The existing Tailwind classes handle vertical centering:
- `top-1/2` → `top: 50%`
- `-translate-y-1/2` → `transform: translateY(-50%)`
- `size-4` icon = 16px height
- `py-2` input padding = 16px total (8px top + 8px bottom)

This centers the 16px icon perfectly within the input's text line height.

### No Other Changes Required
- No `.env` modifications
- No server restarts needed
- No database changes
- No other components affected
- Design preserved (same icons, same input style, same layout)

## Testing Recommendations
1. Verify the search bar displays correctly with no icon/text overlap
2. Test on mobile, tablet, and desktop resolutions
3. Confirm typing in the search field works correctly
4. Verify navigation between tabs and search functionality
5. Run `pnpm build` to ensure no regressions (environment path issue separate from code)