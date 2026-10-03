#!/usr/bin/env bash
cd /home/solomon/gaz-point
source ~/.nvm/nvm.sh >/dev/null 2>&1
pkill -f "next start" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1
setsid nohup pnpm start < /dev/null > /tmp/gp-server.log 2>&1 &
disown
sleep 4
for i in $(seq 1 30); do
  if curl -sf -o /dev/null http://localhost:3000/; then
    echo "serveur pret, IP WSL: $(hostname -I | awk '{print $1}')"
    exit 0
  fi
  sleep 1
done
echo "ECHEC"; tail -10 /tmp/gp-server.log; exit 1