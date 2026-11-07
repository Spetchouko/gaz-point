#!/usr/bin/env bash
cd ~/gaz-point
grep -n -A 20 'getSignedCookie: async' node_modules/.pnpm/better-call@1.4.0_zod@4.6.5/node_modules/better-call/dist/context.mjs | head -30
echo '--- getSession route logic after cookie read ---'
sed -n '35,75p' node_modules/better-auth/dist/api/routes/session.mjs
