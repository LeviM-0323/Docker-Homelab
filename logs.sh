#!/bin/bash
date

echo "Type container to view logs for: "
read container_name

echo "Follow log output? (y/n): "
read answer

if [$answer="y"]; then
    echo "Showing logs for container $container_name following output..."
    sudo docker compose logs $container_name -f
else
    echo "Showing logs for container $container_name..."
    sudo docker compose logs $container_name
fi
