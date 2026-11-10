#!/bin/bash
set -e
cd /home/solomon/gaz-point
export PATH=/home/solomon/gaz-point/node_modules/.bin:$PATH
echo '== pnpm --version =='
pnpm --version
echo '== pnpm lint =='
pnpm lint
echo '== lint OK =='
