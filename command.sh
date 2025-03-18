#!/bin/bash
date

CONTAINER=$1
COMMAND=$2

if [ -z "$CONTAINER" ] || [ -z "$COMMAND" ]; then
    echo "Usage: $0 <container_name> <command>"
    exit 1
fi

echo "Executing command in container: $CONTAINER"
sudo docker compose exec -it "$CONTAINER" "$COMMAND"