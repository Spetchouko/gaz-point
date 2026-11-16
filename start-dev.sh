#!/usr/bin/env bash
cd /home/solomon/gaz-point
export PATH="$HOME/.node/node-v20.19.0-linux-x64/bin:$PATH"
setsid bash -c 'pnpm dev > /home/solomon/gaz-point/dev-server-out.txt 2>&1' </dev/null >/dev/null 2>&1 &
disown
echo "Serveur de développement lancé en arrière-plan (PID: $!)"
