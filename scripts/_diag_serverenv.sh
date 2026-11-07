#!/usr/bin/env bash
ps aux | grep -E 'next|node' | grep -v grep | awk '{print $2, $11, $12, $13}' | head -10
