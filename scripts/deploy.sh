#!/bin/bash
cd /var/www/luizautomoveis
git pull
npm install
pm2 restart luizautomoveis 