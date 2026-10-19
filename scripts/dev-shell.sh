#!/usr/bin/env bash
# Runs a command inside the project with the WSL Node toolchain.
# Usage: scripts/dev-shell.sh pnpm lint
set -e
export PATH="/home/solomon/.nvm/versions/node/v24.21.0/bin:/usr/local/bin:/usr/bin:/bin"
cd /home/solomon/gaz-point
exec "$@"
