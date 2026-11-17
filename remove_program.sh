#!/bin/bash
cd /home/solomon/gaz-point
if [ -d "Program" ]; then
  rm -rf Program
  echo "Removed directory Program"
elif [ -f "Program" ]; then
  rm Program
  echo "Removed file Program"
else
  echo "Program does not exist"
fi