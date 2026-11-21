#!/bin/bash
cd /home/solomon/gaz-point
# Force Turbopack à recompiler db/schema.ts (le serveur dev tourne depuis 08:00).
touch db/schema.ts
sleep 2
stat -c '%y %n' db/schema.ts
echo "touch effectué"
