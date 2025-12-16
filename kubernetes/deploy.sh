#!/bin/bash

# CSC418 DevOps Project - Kubernetes Deployment Script
# Apply all Kubernetes manifests in correct order

set -e

echo "🚀 Deploying to Kubernetes..."

# Apply ConfigMap and Secret
echo "📝 Creating ConfigMap and Secret..."
kubectl apply -f kubernetes/postgres-config.yaml

# Apply PersistentVolumeClaim
echo "💾 Creating PersistentVolumeClaim..."
kubectl apply -f kubernetes/postgres-pvc.yaml

# Wait for PVC to be bound
echo "⏳ Waiting for PVC to be bound..."
kubectl wait --for=condition=bound pvc/postgres-pvc --timeout=60s || true

# Deploy PostgreSQL
echo "🐘 Deploying PostgreSQL..."
kubectl apply -f kubernetes/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

# Deploy Application
echo "📦 Deploying Student Management Application..."
kubectl apply -f kubernetes/app-deployment.yaml

# Create Service
echo "🌐 Creating Service..."
kubectl apply -f kubernetes/app-service.yaml

# Wait for Application to be ready
echo "⏳ Waiting for Application to be ready..."
kubectl wait --for=condition=ready pod -l app=student-app --timeout=120s

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment Status:"
kubectl get deployments
echo ""
echo "🔌 Services:"
kubectl get services
echo ""
echo "📦 Pods:"
kubectl get pods
echo ""
echo "🌐 Access the application:"
echo "NodePort: kubectl get svc student-app-service"
echo "Port Forward: kubectl port-forward svc/student-app-service 3000:3000"
