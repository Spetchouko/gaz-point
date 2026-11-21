#!/bin/bash
cd /home/solomon/gaz-point
./node_modules/.bin/tsc --noEmit 2>&1 | head -60
echo "TSC_EXIT=${PIPESTATUS[0]}"
