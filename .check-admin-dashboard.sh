#!/bin/bash
set -e
cd /home/solomon/gaz-point
export PATH=/home/solomon/gaz-point/node_modules/.bin:$PATH
echo '== tsc --noEmit =='
tsc --noEmit
echo '== tsc OK =='
