#!/bin/bash
set -e
cd /home/solomon/gaz-point
export PATH=/home/solomon/node20/bin:/home/solomon/node-v20.19.0-linux-x64/bin:/home/solomon/gaz-point/node_modules/.bin:$PATH
echo '== native node =='
node --version
echo '== native pnpm via corepack =='
corepack prepare pnpm@12.8.1 --activate 2>&1 || true
echo 'pk via corepack:'
corepack pnpm@12.8.1 --version
echo '== pnpm --version =='
corepack pnpm --version
