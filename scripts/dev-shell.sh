#!/usr/bin/env bash
# Helper to run commands in the project with a proper Node toolchain (WSL).
set -e
export PATH="/home/solomon/.nvm/versions/node/v24.21.0/bin:/usr/local/bin:/usr/bin:/bin"
cd /home/solomon/gaz-point
exec "$@"
