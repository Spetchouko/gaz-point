#!/bin/bash
cd /home/solomon/gaz-point
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
rm -rf .next
node node_modules/.bin/next build 2>&1 || true
# Try with the shim
node_modules/.bin/next build 2>&1 || true
