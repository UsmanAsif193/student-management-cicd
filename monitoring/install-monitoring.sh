#!/bin/bash

# CSC418 DevOps Project - Prometheus & Grafana Installation Script

set -e

echo "📊 Installing Prometheus & Grafana Monitoring Stack"
echo "===================================================="

# Add Helm repositories
echo "📦 Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
echo "📁 Creating monitoring namespace..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Install kube-prometheus-stack
echo "🔧 Installing kube-prometheus-stack..."
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=30090 \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30091 \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --wait --timeout=10m

echo ""
echo "✅ Installation completed successfully!"
echo ""

# Get Grafana password
echo "🔐 Grafana Credentials:"
echo "========================"
echo "Username: admin"
echo -n "Password: "
kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
echo ""
echo ""

# Display service information
echo "🌐 Service Information:"
echo "========================"
kubectl get svc -n monitoring
echo ""

# Display pod status
echo "📦 Pod Status:"
echo "========================"
kubectl get pods -n monitoring
echo ""

# Access information
echo "📊 Access URLs:"
echo "========================"
echo "Prometheus: http://<NODE-IP>:30090"
echo "Grafana: http://<NODE-IP>:30091"
echo ""
echo "To get NODE-IP, run: kubectl get nodes -o wide"
echo ""

echo "✅ Monitoring stack is ready!"
