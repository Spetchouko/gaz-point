#!/usr/bin/env bash
cat /home/solomon/gaz-point/build-after.txt | tr -d '\000' | grep -a -i "error\|success\|Compiled" | head -20
