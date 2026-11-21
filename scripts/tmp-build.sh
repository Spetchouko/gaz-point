#!/bin/bash
cd /home/solomon/gaz-point
NODE_PATH="node_modules/.pnpm/next@16.3.7_@babel+core@7.29.7_supports-color@7.2.0__@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/node_modules:node_modules/.pnpm/next@16.3.7_@babel+core@7.29.7_supports-color@7.2.0__@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules:node_modules/.pnpm/node_modules" \
/home/solomon/.nvm/versions/node/v20.20.2/bin/node \
node_modules/.pnpm/next@16.3.7_@babel+core@7.29.7_supports-color@7.2.0__@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8/node_modules/next/dist/bin/next build 2>&1
echo "BUILD_EXIT=$?"
