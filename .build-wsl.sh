#!/usr/bin/env bash
set -uo pipefail
cd /home/solomon/gaz-point || exit 1
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
echo "node: $(node --version)"
echo "pnpm: $(~/.local/share/pnpm/bin/pnpm --version)"
~/.local/share/pnpm/bin/pnpm build
echo "BUILD_EXIT=$?"
