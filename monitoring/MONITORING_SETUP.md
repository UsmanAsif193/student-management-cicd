# Prometheus & Grafana Setup Guide

## Overview
This guide explains how to set up Prometheus and Grafana for monitoring your Kubernetes cluster and application.

## Installation (Automated via Jenkins)

The Jenkins pipeline automatically installs both Prometheus and Grafana using Helm. However, you can also install them manually.

## Manual Installation

### Prerequisites
```bash
# Install Helm (if not already installed)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify Helm installation
helm version
```

### Install Prometheus Stack
```bash
# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack (includes Prometheus, Grafana, and Alertmanager)
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=30090 \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30091
```

### Verify Installation
```bash
# Check all resources in monitoring namespace
kubectl get all -n monitoring

# Check services
kubectl get svc -n monitoring
```

## Access Prometheus

### Get Prometheus URL
```bash
# Get NodePort
kubectl get svc -n monitoring | grep prometheus

# Access Prometheus
# http://<NODE-IP>:30090
```

### Prometheus Targets
1. Access Prometheus UI: `http://<NODE-IP>:30090`
2. Go to: **Status → Targets**
3. Verify all targets are "UP"

### Useful Prometheus Queries
```promql
# CPU Usage
rate(container_cpu_usage_seconds_total[5m])

# Memory Usage
container_memory_usage_bytes

# Network Traffic
rate(container_network_receive_bytes_total[5m])

# Pod Restarts
kube_pod_container_status_restarts_total

# Application Health
up{job="student-app"}
```

## Access Grafana

### Get Grafana Credentials
```bash
# Username is: admin

# Get Password
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
echo
```

### Access Grafana UI
```
URL: http://<NODE-IP>:30091
Username: admin
Password: <from command above>
```

## Configure Grafana

### 1. Login
- Use credentials from above
- You'll be prompted to change password (optional)

### 2. Verify Prometheus Data Source
1. Click **⚙️ Configuration → Data Sources**
2. You should see **Prometheus** already configured
3. Click on it to verify:
   - URL: `http://prometheus-kube-prometheus-prometheus.monitoring:9090`
   - Access: Server (default)
4. Click **Save & Test** - should show ✅ "Data source is working"

### 3. Import Pre-built Dashboards

#### Dashboard 1: Kubernetes Cluster Monitoring
1. Click **+ → Import**
2. Enter Dashboard ID: `3119`
3. Click **Load**
4. Select Prometheus data source
5. Click **Import**

#### Dashboard 2: Node Exporter Full
1. Click **+ → Import**
2. Enter Dashboard ID: `1860`
3. Click **Load**
4. Select Prometheus data source
5. Click **Import**

#### Dashboard 3: Kubernetes Pod Monitoring
1. Click **+ → Import**
2. Enter Dashboard ID: `6417`
3. Click **Load**
4. Select Prometheus data source
5. Click **Import**

### 4. Create Custom Dashboard for Application

#### Create New Dashboard
1. Click **+ → Create → Dashboard**
2. Click **Add new panel**

#### Panel 1: Application Response Time
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[5m])
)
```
- Title: Application Response Time (95th percentile)
- Unit: seconds (s)

#### Panel 2: Request Rate
```promql
rate(http_requests_total[5m])
```
- Title: HTTP Requests per Second
- Unit: requests/sec

#### Panel 3: Error Rate
```promql
rate(http_requests_total{status=~"5.."}[5m])
```
- Title: HTTP 5xx Errors per Second
- Unit: errors/sec

#### Panel 4: Pod CPU Usage
```promql
sum(rate(container_cpu_usage_seconds_total{pod=~"student-app.*"}[5m])) by (pod)
```
- Title: Pod CPU Usage
- Unit: cores

#### Panel 5: Pod Memory Usage
```promql
sum(container_memory_usage_bytes{pod=~"student-app.*"}) by (pod)
```
- Title: Pod Memory Usage
- Unit: bytes

#### Panel 6: Database Connections
```promql
pg_stat_database_numbackends{datname="studentdb"}
```
- Title: PostgreSQL Active Connections
- Unit: connections

### 5. Save Dashboard
1. Click **💾 Save dashboard**
2. Name: `Student Management System - Application Metrics`
3. Click **Save**

## Monitoring Metrics Explained

### Cluster Metrics
- **Node CPU Usage**: CPU utilization across all nodes
- **Node Memory Usage**: Memory consumption per node
- **Pod Count**: Number of running pods
- **Network I/O**: Network traffic in/out

### Application Metrics
- **Request Rate**: Number of HTTP requests per second
- **Response Time**: Average/P95/P99 response times
- **Error Rate**: HTTP 4xx and 5xx errors
- **Pod Health**: Number of healthy vs unhealthy pods

### Database Metrics
- **Active Connections**: Current database connections
- **Query Performance**: Average query execution time
- **Database Size**: Current database storage usage

## Alerting (Optional Enhancement)

### Create Alert Rule in Grafana

1. Go to **Alerting → Alert rules → New alert rule**

#### Alert: High CPU Usage
```
Alert Name: High CPU Usage
Condition: avg() OF query(A, 5m, now) > 80
For: 5 minutes
Annotations:
  - Summary: Pod CPU usage is above 80%
```

#### Alert: High Memory Usage
```
Alert Name: High Memory Usage
Condition: avg() OF query(B, 5m, now) > 80
For: 5 minutes
```

#### Alert: Pod Down
```
Alert Name: Pod Down
Condition: count() OF query(C, 1m, now) < 2
For: 2 minutes
Annotations:
  - Summary: Less than 2 application pods running
```

## Useful kubectl Commands

```bash
# Port-forward Prometheus (alternative access)
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Port-forward Grafana (alternative access)
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80

# Check Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus

# Check Grafana logs
kubectl logs -n monitoring -l app.kubernetes.io/name=grafana

# Restart Grafana pod
kubectl rollout restart deployment/prometheus-grafana -n monitoring
```

## Troubleshooting

### Prometheus Not Scraping Targets
```bash
# Check ServiceMonitor resources
kubectl get servicemonitor -n monitoring

# Check Prometheus configuration
kubectl get secret prometheus-prometheus-kube-prometheus-prometheus -n monitoring -o yaml
```

### Grafana Dashboard Not Loading
1. Verify data source connection
2. Check time range (top-right corner)
3. Verify Prometheus is collecting metrics
4. Check query syntax in panel edit mode

### No Data in Dashboards
```bash
# Verify Prometheus is running
kubectl get pods -n monitoring | grep prometheus

# Check if metrics are being collected
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Access: http://localhost:9090/targets
```

## Marks Distribution (17 Marks)

✅ **Prometheus Installation (8 marks)**
- Using Helm chart
- Proper namespace configuration
- NodePort service exposure
- Verification of running pods

✅ **Grafana Installation (6 marks)**
- Included in kube-prometheus-stack
- Service exposure via NodePort
- Credential retrieval
- Dashboard access

✅ **Dashboard Configuration (3 marks)**
- Data source configuration
- Import pre-built dashboards
- Create custom application dashboard
- Screenshots in report

## For Lab Report

Include screenshots of:
1. ✅ Prometheus UI showing targets
2. ✅ Grafana login screen
3. ✅ Grafana data source configuration
4. ✅ Kubernetes cluster monitoring dashboard
5. ✅ Custom application metrics dashboard
6. ✅ Pod metrics showing CPU/Memory usage
7. ✅ kubectl commands showing monitoring namespace resources

## References

- Prometheus Official Docs: https://prometheus.io/docs/
- Grafana Official Docs: https://grafana.com/docs/
- Kube-Prometheus-Stack: https://github.com/prometheus-community/helm-charts
- Dashboard IDs: https://grafana.com/grafana/dashboards/
