#!/bin/bash
date

if [ -z "$1" ]; then
    echo "Starting all containers..."
    sudo docker compose --env-file .env up --build --force-recreate --remove-orphans -d
else 
    echo "Starting container: $1"
    sudo docker compose --env-file .env up --build --force-recreate -d "$1"
fi