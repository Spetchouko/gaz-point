#!/usr/bin/env bash
sleep 20
# Vérifier si le serveur écoute sur le port 3000
ss -tlnp 2>/dev/null | grep ':3000' || netstat -tlnp 2>/dev/null | grep ':3000' || echo "Port 3000 non détecté via ss/netstat"
# Essayer une requête HTTP
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "Curl non disponible ou serveur non joignable"
