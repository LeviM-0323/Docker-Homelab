#!/bin/bash
date

echo "Type containers to start (blank for all): "
read container_name

if [ -n $container_name ]; then
    echo "Starting container $container_name..."
    sudo docker compose up $container_name -d
else
    echo "All containers starting..."
    sudo docker compose up -d
fi
