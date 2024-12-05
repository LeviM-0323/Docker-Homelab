#!/bin/bash
date

echo "Restarting what containers (blank for all): "
read container_name

if [ -n $container_name ]; then
    echo "Restarting container $container_name"
    sudo docker compose restart $container_name
else
    echo "Restarting all containers..."
    sudo docker compose restart
fi