#!/bin/bash
date

echo "Type container for system usage (blank for all): "
read container_name

echo "Steam output? (y/n)"
read response

if [ -n $container_name ]; then
    if [ "$response" = "y" ]; then
        echo "stats for $container_name with streaming"
        sudo docker compose stats $container_name
    else
        echo "stats for $container_name"
        sudo docker compose stats $container_name --no-stream
    fi
else
    if [ "$response" = "y" ]; then
        echo "all container stats with streaming..."
        sudo docker compose stats
    else 
        echo "all container stats..."
        sudo docker compose stats --nosteam
    fi
fi