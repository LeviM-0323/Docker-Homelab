#!/bin/bash
date

if [ -z "$1" ]; then
    echo "Restarting all containers..."
    sudo docker compose --env-file .env restart --build -d
else 
    echo "Restarting container: $1"
    sudo docker compose --env-file .env restart --build -d "$1"
fi