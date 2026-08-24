#!/bin/bash
cd /var/www/apps/vivetalk
export NODE_OPTIONS="--max-old-space-size=2500"
unset CI
npx expo start --tunnel --clear
