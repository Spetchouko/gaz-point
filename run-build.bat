@echo off
cd /d \\wsl.localhost\Ubuntu-24.04\home\solomon\gaz-point
set NODE_PATH=node_modules\.pnpm\next@16.3.7_@babel+core@7.29.7_supports-color@7.2.0__@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8\node_modules\next\node_modules;node_modules\.pnpm\next@16.3.7_@babel+core@7.29.7_supports-color@7.2.0__@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8\node_modules;node_modules\.pnpm\node_modules
node node_modules\.pnpm\next@16.3.7_@babel+core@7.29.7_supports-color@7.2.0__@types+node@20.19.43_react-dom@19.2.8_react@19.2.8__react@19.2.8\node_modules\next\dist\bin\next build
