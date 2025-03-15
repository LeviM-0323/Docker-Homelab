#!/bin/bash
date

if [ -z "$1" ]; then
    echo "Stopping all containers..."
    sudo docker compose stop
else 
    echo "Stopping container: $1"
    sudo docker compose stop "$1"
fi