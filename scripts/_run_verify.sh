#!/usr/bin/env bash
cd ~/gaz-point
export PATH=/usr/bin:/home/solomon/.nvm/versions/node/v20.20.2/bin:/home/solomon/.local/share/pnpm/bin:$PATH
node scripts/_diag_verify.cjs 'Ra8iqErjoQU56NIZOSHxMJIMuclgJ8Eg'
