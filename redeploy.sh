#!/bin/bash

cd "$(dirname "$0")"

git pull

npm run downloadCertBundle
npm run downloadFlags

docker-compose build
docker-compose up -d --force-recreate
