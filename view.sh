#!/bin/bash
date

CONTAINER=$1

if [ -z "$CONTAINER" ]; then
    echo "Viewing all containers..."
    sudo docker compose ps
else
    echo "Viewing container: $CONTAINER"
    sudo docker compose ps "$CONTAINER"
fi