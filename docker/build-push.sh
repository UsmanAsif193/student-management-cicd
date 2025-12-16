#!/bin/bash

# CSC418 DevOps Project - Docker Build Script
# This script builds and pushes Docker image to DockerHub

set -e

# Variables (Change these according to your DockerHub account)
DOCKERHUB_USERNAME="usmanasif193"
IMAGE_NAME="student-management-system"
IMAGE_TAG="latest"

# Full image name
FULL_IMAGE_NAME="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "🔨 Building Docker image..."
echo "Image: ${FULL_IMAGE_NAME}"

# Build the image
docker build -t ${FULL_IMAGE_NAME} -f docker/Dockerfile app/

echo "✅ Image built successfully!"

# Login to DockerHub (optional - for manual testing)
# echo "🔐 Logging in to DockerHub..."
# docker login -u ${DOCKERHUB_USERNAME}

# Push to DockerHub
echo "📤 Pushing image to DockerHub..."
docker push ${FULL_IMAGE_NAME}

echo "✅ Image pushed successfully!"
echo "Image available at: ${FULL_IMAGE_NAME}"
