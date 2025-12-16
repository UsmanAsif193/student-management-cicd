# Testing Guide - CSC418 DevOps Project

## Quick Testing Checklist

Use this guide to verify each component of your CI/CD pipeline.

---

## 1. Local Development Testing

### 1.1 Test Application Locally (without Docker)

```bash
# Navigate to app directory
cd app/

# Install dependencies
npm install

# Start PostgreSQL using Docker
docker run -d \
  --name test-postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=studentdb \
  -p 5432:5432 \
  postgres:15-alpine

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres123
export DB_NAME=studentdb

# Start application
npm start
```

**Expected Output:**
```
🚀 Server running on port 3000
✅ Database connected successfully
✅ Students table initialized
```

### 1.2 Test API Endpoints

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Add Student:**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Ali",
    "roll_number": "FA21-BCE-123",
    "department": "Computer Science",
    "semester": 7
  }'
```

**Get All Students:**
```bash
curl http://localhost:3000/api/students
```

**Get Single Student:**
```bash
curl http://localhost:3000/api/students/1
```

**Delete Student:**
```bash
curl -X DELETE http://localhost:3000/api/students/1
```

---

## 2. Docker Testing

### 2.1 Build Docker Image Locally

```bash
# Build image
cd /path/to/project
docker build -t student-management-system:test -f docker/Dockerfile app/

# Verify image created
docker images | grep student-management-system
```

### 2.2 Test with Docker Compose

```bash
# Start services
cd docker/
docker-compose up -d

# Check logs
docker-compose logs -f app

# Test application
curl http://localhost:3000/health
curl http://localhost:3000/api/students

# Stop services
docker-compose down
```

### 2.3 Test DockerHub Push (Manual)

```bash
# Login to DockerHub
docker login

# Tag image
docker tag student-management-system:test your-username/student-management-system:test

# Push image
docker push your-username/student-management-system:test

# Verify on DockerHub
# Visit: https://hub.docker.com/r/your-username/student-management-system
```

---

## 3. Kubernetes Testing

### 3.1 Deploy Manually to Kubernetes

```bash
# Apply all manifests
cd kubernetes/

# Create namespace (optional)
kubectl create namespace dev

# Apply configurations
kubectl apply -f postgres-config.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
kubectl wait --for=condition=ready pod -l app=student-app --timeout=120s
```

### 3.2 Verify Kubernetes Deployment

```bash
# Check all resources
kubectl get all

# Check pods
kubectl get pods -o wide

# Check services
kubectl get svc

# Check PVC
kubectl get pvc

# Check ConfigMaps and Secrets
kubectl get configmap
kubectl get secret
```

### 3.3 Test Application on Kubernetes

```bash
# Get Node IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')

# If ExternalIP is not available, use InternalIP or Instance IP
echo $NODE_IP

# Test application
curl http://$NODE_IP:30080/health
curl http://$NODE_IP:30080/api/students

# Or use port-forward for testing
kubectl port-forward svc/student-app-service 3000:3000

# Test on localhost
curl http://localhost:3000/health
```

### 3.4 Test Database Connection

```bash
# Get PostgreSQL pod name
POSTGRES_POD=$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Connect to database
kubectl exec -it $POSTGRES_POD -- psql -U postgres -d studentdb

# In PostgreSQL prompt:
\dt                          # List tables
SELECT * FROM students;      # View data
\q                          # Exit
```

### 3.5 View Application Logs

```bash
# Get app pod name
APP_POD=$(kubectl get pods -l app=student-app -o jsonpath='{.items[0].metadata.name}')

# View logs
kubectl logs $APP_POD

# Follow logs
kubectl logs -f $APP_POD

# View previous logs (if pod restarted)
kubectl logs $APP_POD --previous
```

---

## 4. Jenkins Pipeline Testing

### 4.1 Manual Pipeline Trigger

1. Go to Jenkins: `http://<EC2-IP>:8080`
2. Navigate to your pipeline job
3. Click **Build Now**
4. Click on build number
5. Click **Console Output**
6. Monitor each stage execution

### 4.2 Webhook Trigger Testing

```bash
# Make a small change
cd /path/to/project
echo "# Test webhook" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Trigger Jenkins webhook"
git push origin main

# Immediately check Jenkins
# Jenkins should start building automatically within 30 seconds
```

### 4.3 Verify Jenkins Stages

**Expected Console Output:**

```
✅ Stage 1: Code Fetch from GitHub - SUCCESS
   Repository: https://github.com/username/repo.git
   Branch: main
   Commit: abc123...

✅ Stage 2: Build Docker Image - SUCCESS
   Image Name: username/student-management-system:123
   
✅ Stage 2: Push to DockerHub - SUCCESS
   Images pushed successfully

✅ Stage 3: Deploy to Kubernetes - SUCCESS
   Deployment updated
   Pods are ready

✅ Stage 4: Install Prometheus - SUCCESS
   Prometheus installed

✅ Stage 4: Install Grafana - SUCCESS
   Grafana configured

✅ PIPELINE COMPLETED SUCCESSFULLY!
```

### 4.4 Verify Docker Image on DockerHub

1. Visit: `https://hub.docker.com/r/your-username/student-management-system`
2. Check **Tags** section
3. Verify latest build number tag exists
4. Check image size and creation time

---

## 5. Monitoring Testing

### 5.1 Access Prometheus

```bash
# Get Node IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')

# Access Prometheus
echo "Prometheus URL: http://$NODE_IP:30090"

# Or use port-forward
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Access: http://localhost:9090
```

**Verify Targets:**
1. Go to **Status → Targets**
2. All targets should show "UP"
3. Look for:
   - `kubernetes-pods`
   - `kubernetes-nodes`
   - `kubernetes-service-endpoints`

**Test PromQL Queries:**
```promql
# All pods
up

# Application pods only
up{pod=~"student-app.*"}

# Pod CPU usage
rate(container_cpu_usage_seconds_total{pod=~"student-app.*"}[5m])

# Pod memory usage
container_memory_usage_bytes{pod=~"student-app.*"}
```

### 5.2 Access Grafana

```bash
# Get Grafana password
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
echo

# Get Node IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')

# Access Grafana
echo "Grafana URL: http://$NODE_IP:30091"
echo "Username: admin"
echo "Password: <from above command>"

# Or use port-forward
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80
# Access: http://localhost:3001
```

**Verify Grafana:**
1. Login with admin credentials
2. Go to **Configuration → Data Sources**
3. Click on Prometheus
4. Click **Save & Test**
5. Should show: "✅ Data source is working"

**Test Dashboards:**
1. Import dashboard 3119 (Kubernetes Cluster)
2. Import dashboard 1860 (Node Exporter)
3. Verify all panels show data
4. Create custom dashboard with student-app metrics

---

## 6. End-to-End Testing

### 6.1 Complete Workflow Test

This tests the entire CI/CD pipeline from code change to deployment.

**Step 1: Make Code Change**
```bash
cd app/
# Edit server.js - add console.log or change version
echo "console.log('Version 2.0');" >> server.js
```

**Step 2: Commit and Push**
```bash
git add .
git commit -m "Update: Version 2.0"
git push origin main
```

**Step 3: Verify Webhook Triggered Jenkins**
- Check Jenkins dashboard
- New build should start automatically
- Note the build number

**Step 4: Monitor Build Progress**
- Watch console output in Jenkins
- Verify all 4 stages complete successfully

**Step 5: Verify Docker Image**
- Check DockerHub for new image with build number tag
- Verify image creation timestamp

**Step 6: Verify Kubernetes Deployment**
```bash
# Check if new pods are created
kubectl get pods -l app=student-app -w

# Verify image version in deployment
kubectl describe deployment student-app-deployment | grep Image

# Should show: your-username/student-management-system:latest
```

**Step 7: Test Application**
```bash
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')
curl http://$NODE_IP:30080/health
curl http://$NODE_IP:30080/api/students
```

**Step 8: Check Logs**
```bash
kubectl logs -l app=student-app --tail=50

# Should see your new console.log message
```

**Step 9: Verify in Grafana**
- Access Grafana dashboard
- Check if metrics are updating
- Verify pod restart count (should be recent)

---

## 7. Load Testing

### 7.1 Install Apache Bench

```bash
sudo apt install apache2-utils -y
```

### 7.2 Run Load Test

```bash
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')

# Light load test
ab -n 100 -c 5 http://$NODE_IP:30080/health

# Medium load test
ab -n 1000 -c 10 http://$NODE_IP:30080/api/students

# Heavy load test (optional)
ab -n 5000 -c 50 http://$NODE_IP:30080/health
```

### 7.3 Monitor During Load Test

**In Grafana:**
1. Open application dashboard
2. Set time range to "Last 5 minutes"
3. Set refresh to "5s"
4. Watch CPU and memory metrics increase
5. Check request rate graphs

**In Prometheus:**
```promql
# Request rate during load test
rate(http_requests_total[1m])

# CPU during load test
rate(container_cpu_usage_seconds_total{pod=~"student-app.*"}[1m])
```

---

## 8. Failure Testing

### 8.1 Test Pod Recovery

```bash
# Delete a pod
kubectl delete pod -l app=student-app --force --grace-period=0

# Watch Kubernetes recreate it
kubectl get pods -w

# Verify application still works
curl http://$NODE_IP:30080/health
```

### 8.2 Test Database Persistence

```bash
# Add data
curl -X POST http://$NODE_IP:30080/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","roll_number":"TEST-001","department":"CS","semester":1}'

# Delete PostgreSQL pod
kubectl delete pod -l app=postgres --force

# Wait for pod to restart
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

# Verify data still exists
curl http://$NODE_IP:30080/api/students
```

### 8.3 Test Pipeline Failure Recovery

```bash
# Introduce syntax error in code
echo "This will cause error;" >> app/server.js

# Commit and push
git add .
git commit -m "Test: Pipeline failure"
git push origin main

# Jenkins build should FAIL
# Check console output for error

# Fix the error
git revert HEAD
git push origin main

# Jenkins should build successfully again
```

---

## 9. Cleanup & Reset

### 9.1 Clean Kubernetes Resources

```bash
# Delete application
kubectl delete -f kubernetes/app-service.yaml
kubectl delete -f kubernetes/app-deployment.yaml

# Delete database
kubectl delete -f kubernetes/postgres-deployment.yaml
kubectl delete -f kubernetes/postgres-pvc.yaml
kubectl delete -f kubernetes/postgres-config.yaml

# Verify all deleted
kubectl get all
```

### 9.2 Clean Monitoring Stack

```bash
# Uninstall Prometheus/Grafana
helm uninstall prometheus -n monitoring

# Delete namespace
kubectl delete namespace monitoring
```

### 9.3 Clean Docker Images

```bash
# On Jenkins server
docker images | grep student-management-system
docker rmi $(docker images -q student-management-system)

# Clean Docker system
docker system prune -a
```

---

## 10. Troubleshooting Common Test Failures

### Issue: Application Can't Connect to Database
```bash
# Check if PostgreSQL is running
kubectl get pods -l app=postgres

# Check PostgreSQL logs
kubectl logs -l app=postgres

# Verify service DNS
kubectl exec -it <app-pod-name> -- nslookup postgres-service

# Test database connection from app pod
kubectl exec -it <app-pod-name> -- nc -zv postgres-service 5432
```

### Issue: Jenkins Pipeline Fails at Docker Stage
```bash
# On Jenkins server, check Docker
docker ps
docker version

# Check Jenkins user has Docker access
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Issue: Webhook Not Triggering Jenkins
1. Check webhook delivery history on GitHub
2. Verify Jenkins webhook URL is correct: `http://<PUBLIC-IP>:8080/github-webhook/`
3. Check Jenkins logs: `sudo journalctl -u jenkins -f`
4. Verify security group allows port 8080 from GitHub IPs

### Issue: Can't Access Application on NodePort
```bash
# Check service
kubectl get svc student-app-service

# Verify NodePort (should be 30080)
kubectl describe svc student-app-service

# Check AWS Security Group allows port 30080
# Check if pods are running
kubectl get pods -l app=student-app
```

### Issue: No Metrics in Grafana
```bash
# Check Prometheus is scraping
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Visit http://localhost:9090/targets

# Verify data source in Grafana
# Configuration → Data Sources → Prometheus → Test

# Check if metrics exist in Prometheus
# Try query: up
```

---

## 11. Testing Checklist for Submission

Before submitting, verify all these work:

### ✅ Application
- [ ] Application runs locally
- [ ] All API endpoints work
- [ ] Database connection successful
- [ ] Health check returns 200 OK

### ✅ Docker
- [ ] Docker image builds successfully
- [ ] Image pushed to DockerHub
- [ ] Image appears in DockerHub repository
- [ ] docker-compose works locally

### ✅ Kubernetes
- [ ] All pods are Running
- [ ] Services are accessible via NodePort
- [ ] PVC is Bound
- [ ] ConfigMaps and Secrets exist
- [ ] Application accessible from browser/curl

### ✅ Jenkins
- [ ] Jenkins is accessible at port 8080
- [ ] Pipeline job exists
- [ ] Manual build works
- [ ] Webhook triggers automatically
- [ ] All 4 stages complete successfully
- [ ] DockerHub credentials configured
- [ ] kubectl works from Jenkins

### ✅ GitHub
- [ ] Code is pushed to GitHub
- [ ] Webhook is configured
- [ ] Webhook shows successful deliveries
- [ ] Repository is accessible

### ✅ Monitoring
- [ ] Prometheus accessible at port 30090
- [ ] All Prometheus targets are UP
- [ ] Grafana accessible at port 30091
- [ ] Grafana login works
- [ ] Data source configured
- [ ] Dashboards imported
- [ ] Metrics are visible

### ✅ Documentation
- [ ] README.md is complete
- [ ] Lab report is complete
- [ ] Screenshots are ready
- [ ] All sections filled

---

## 12. Performance Benchmarks

Expected performance metrics for reference:

### Application Response Times
- Health check: < 50ms
- Get all students: < 100ms
- Add student: < 150ms
- Get single student: < 80ms

### Build Times
- Docker build: 1-2 minutes
- Kubernetes deployment: 30-60 seconds
- Complete pipeline: 5-8 minutes

### Resource Usage
- Application pod: ~100MB memory, 0.1 CPU
- PostgreSQL pod: ~200MB memory, 0.2 CPU
- Total: ~500MB for application stack

---

**Testing completed successfully!** 🎉

All components verified and working as expected.
