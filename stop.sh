#!/bin/bash
date

echo "Type which containers to stop (blank for all): "
read container_name

if [ -n $container_name ]; then
    echo "Stopping container $container_name..."
    sudo docker compose stop $container_name
else
    echo "Stopping all containers..."
    sudo docker compose stop
fi