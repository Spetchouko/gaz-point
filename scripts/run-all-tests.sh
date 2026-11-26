#!/bin/bash
export PATH=/tmp/node-v20.20.2-linux-x64/bin:$PATH
cd /home/solomon/gaz-point
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/auth-routing-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/client-dashboard-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/csv-export-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/publicite-analytics-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/search-results-url-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/gas-brands-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/avis-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/disponibilite-overlay-tests.ts &&
/home/solomon/.local/share/pnpm/bin/pnpm exec tsx __tests__/publicite-rotation-tests.ts