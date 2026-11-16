#!/usr/bin/env bash
cat /home/solomon/gaz-point/build-fix.txt | tr -d '\000' | grep -a -i "error\|success\|Compiled\|ENOENT" | head -20
