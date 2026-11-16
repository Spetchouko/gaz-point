#!/usr/bin/env bash
ps aux | grep -E 'next dev|pnpm dev|node.*next' | grep -v grep || echo "Aucun processus next dev trouvé"
ls -la dev-server-out.txt 2>/dev/null || echo "Fichier de log non trouvé"
