#!/bin/bash
cd /home/solomon/gaz-point
export PATH="/home/solomon/.nvm/versions/node/v20.20.2/bin:$PATH"
./node_modules/.bin/next build
echo "BUILD_EXIT=$?"
