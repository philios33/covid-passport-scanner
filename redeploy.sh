#!/bin/bash

cd "$(dirname "$0")"

git pull
if [ $? -ne 0 ]; then { exit $?; } fi

npm run downloadCertBundle
if [ $? -ne 0 ]; then { exit $?; } fi

npm run downloadFlags
if [ $? -ne 0 ]; then { exit $?; } fi

docker-compose build
if [ $? -ne 0 ]; then { exit $?; } fi

docker-compose up -d --force-recreate
