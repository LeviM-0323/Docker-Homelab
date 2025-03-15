#!/bin/bash
date

CONTAINER=$1

if [ -z "$CONTAINER" ]; then
    echo "Tailing logs for all containers..."
    sudo docker compose logs -f
else
    echo "Tailing logs for container: $CONTAINER"
    sudo docker compose logs -f "$CONTAINER"
fi