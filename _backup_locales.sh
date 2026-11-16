#!/bin/bash
mkdir -p /tmp/gaz-sauvegarde-textes
cp /home/solomon/gaz-point/app/locales/fr.json /tmp/gaz-sauvegarde-textes/fr.json.bak
cp /home/solomon/gaz-point/app/locales/en.json /tmp/gaz-sauvegarde-textes/en.json.bak
echo "Sauvegarde créée"
ls -la /tmp/gaz-sauvegarde-textes/
