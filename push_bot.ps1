# Usage: push_bot.ps1
# This script builds and pushes an image to a container registry
$botPath = "F:\Server\config\discord-bot"
$registry = "reg.levimclean.tech"
$imageName = "levibot"
$tag = "latest"

# Build the Docker image
docker build -t "${registry}/${imageName}:${tag}" $botPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed. Exiting."
    exit 1
}

# Push the image to the registry
docker push "${registry}/${imageName}:${tag}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker push failed. Exiting."
    exit 1
}

Write-Host "Image ${registry}/${imageName}:${tag} built and pushed successfully."