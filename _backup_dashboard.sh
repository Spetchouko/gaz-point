#!/bin/bash
mkdir -p /home/solomon/gaz-point/_backup_dashboard
cp /home/solomon/gaz-point/app/_components/dashboard/client-layout.tsx /home/solomon/gaz-point/_backup_dashboard/client-layout.tsx.bak
cp /home/solomon/gaz-point/app/_components/dashboard/overview.tsx /home/solomon/gaz-point/_backup_dashboard/overview.tsx.bak
cp /home/solomon/gaz-point/app/dashboard/profil/page.tsx /home/solomon/gaz-point/_backup_dashboard/profil-page.tsx.bak
cp /home/solomon/gaz-point/app/dashboard/reservations/page.tsx /home/solomon/gaz-point/_backup_dashboard/reservations-page.tsx.bak
cp /home/solomon/gaz-point/app/dashboard/historique/page.tsx /home/solomon/gaz-point/_backup_dashboard/historique-page.tsx.bak
cp /home/solomon/gaz-point/app/dashboard/notifications/page.tsx /home/solomon/gaz-point/_backup_dashboard/notifications-page.tsx.bak
cp /home/solomon/gaz-point/app/dashboard/parametres/page.tsx /home/solomon/gaz-point/_backup_dashboard/parametres-page.tsx.bak
cp /home/solomon/gaz-point/app/dashboard/layout.tsx /home/solomon/gaz-point/_backup_dashboard/dashboard-layout.tsx.bak
echo "Sauvegarde créée avec succès"
ls -la /home/solomon/gaz-point/_backup_dashboard/
