# Grafana Dashboard Configuration

## Pre-built Dashboard IDs for Import

### 1. Kubernetes Cluster Monitoring
- **Dashboard ID**: 3119
- **Name**: Kubernetes Cluster Monitoring (via Prometheus)
- **Description**: Complete cluster overview including nodes, pods, and resources
- **Import Steps**:
  1. Go to Grafana → + → Import
  2. Enter Dashboard ID: `3119`
  3. Select Prometheus data source
  4. Click Import

### 2. Node Exporter Full
- **Dashboard ID**: 1860
- **Name**: Node Exporter Full
- **Description**: Detailed node metrics including CPU, memory, disk, and network
- **Import Steps**:
  1. Go to Grafana → + → Import
  2. Enter Dashboard ID: `1860`
  3. Select Prometheus data source
  4. Click Import

### 3. Kubernetes Pod Monitoring
- **Dashboard ID**: 6417
- **Name**: Kubernetes Deployment Statefulset Daemonset metrics
- **Description**: Pod-level metrics and resource usage
- **Import Steps**:
  1. Go to Grafana → + → Import
  2. Enter Dashboard ID: `6417`
  3. Select Prometheus data source
  4. Click Import

### 4. PostgreSQL Database
- **Dashboard ID**: 9628
- **Name**: PostgreSQL Database
- **Description**: PostgreSQL metrics and performance
- **Import Steps**:
  1. Go to Grafana → + → Import
  2. Enter Dashboard ID: `9628`
  3. Select Prometheus data source
  4. Click Import

## Custom Application Dashboard

### Panel Configurations

#### Panel 1: HTTP Request Rate
```json
{
  "title": "HTTP Requests/sec",
  "targets": [
    {
      "expr": "rate(http_requests_total[5m])"
    }
  ],
  "type": "graph"
}
```

#### Panel 2: Pod CPU Usage
```json
{
  "title": "Pod CPU Usage",
  "targets": [
    {
      "expr": "sum(rate(container_cpu_usage_seconds_total{pod=~\"student-app.*\"}[5m])) by (pod)"
    }
  ],
  "type": "graph"
}
```

#### Panel 3: Pod Memory Usage
```json
{
  "title": "Pod Memory Usage",
  "targets": [
    {
      "expr": "sum(container_memory_usage_bytes{pod=~\"student-app.*\"}) by (pod)"
    }
  ],
  "type": "graph"
}
```

#### Panel 4: Pod Status
```json
{
  "title": "Running Pods",
  "targets": [
    {
      "expr": "count(kube_pod_status_phase{phase=\"Running\", pod=~\"student-app.*\"})"
    }
  ],
  "type": "stat"
}
```

## Important PromQL Queries

### Application Metrics
```promql
# Total requests
sum(rate(http_requests_total[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m]))

# Response time P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Kubernetes Metrics
```promql
# Pod CPU usage
sum(rate(container_cpu_usage_seconds_total{pod=~"student-app.*"}[5m])) by (pod)

# Pod Memory usage
sum(container_memory_usage_bytes{pod=~"student-app.*"}) by (pod)

# Pod restart count
sum(kube_pod_container_status_restarts_total{pod=~"student-app.*"}) by (pod)
```

### Database Metrics
```promql
# Active connections
pg_stat_database_numbackends{datname="studentdb"}

# Database size
pg_database_size_bytes{datname="studentdb"}

# Transaction rate
rate(pg_stat_database_xact_commit{datname="studentdb"}[5m])
```

## Dashboard Layout Recommendation

```
┌─────────────────────────────────────────────────────────┐
│  Student Management System - Application Dashboard      │
├─────────────────┬─────────────────┬─────────────────────┤
│  Running Pods   │  CPU Usage      │  Memory Usage       │
│    [2/2]        │   [45%]         │    [512MB]          │
├─────────────────┴─────────────────┴─────────────────────┤
│  HTTP Request Rate (Graph)                              │
│  ～～～～～～～～～～～～～～～～～～～～～～～～～～～～ │
├─────────────────────────────────────────────────────────┤
│  Pod CPU Usage by Pod (Graph)                           │
│  ～～～～～～～～～～～～～～～～～～～～～～～～～～～～ │
├─────────────────────────────────────────────────────────┤
│  Pod Memory Usage (Graph)                               │
│  ～～～～～～～～～～～～～～～～～～～～～～～～～～～～ │
├─────────────────────────────────────────────────────────┤
│  Database Active Connections (Graph)                    │
│  ～～～～～～～～～～～～～～～～～～～～～～～～～～～～ │
└─────────────────────────────────────────────────────────┘
```

## For Lab Report

Include screenshots showing:
1. ✅ Grafana login page
2. ✅ Data source configuration page
3. ✅ Imported Kubernetes cluster dashboard
4. ✅ Custom application metrics dashboard
5. ✅ Individual panels with live data
6. ✅ Prometheus targets page
