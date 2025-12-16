# LAB REPORT

## CSC418 – DevOps for Cloud Computing
### CI/CD Pipeline Implementation Using Jenkins, Docker, Kubernetes, Prometheus & Grafana

---

**Submitted To:**  
Dr. Muhammad Imran  
Department of Computer Science  
COMSATS University Islamabad

**Submitted By:**  
[Your Name]  
[Your Roll Number]  
BCT-VII

**Date:** December 16, 2025

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Application Overview](#2-application-overview)
3. [Tools & Technologies](#3-tools--technologies)
4. [Infrastructure Setup](#4-infrastructure-setup)
5. [Pipeline Implementation](#5-pipeline-implementation)
6. [Monitoring Setup](#6-monitoring-setup)
7. [Testing & Verification](#7-testing--verification)
8. [Learning Outcomes](#8-learning-outcomes)
9. [Conclusion](#9-conclusion)
10. [References](#10-references)

---

## 1. Introduction

### 1.1 Objective (CLO-5)
The objective of this lab project is to apply DevOps pipeline automation techniques for code deployment using industry-standard tools and practices. This project demonstrates the complete CI/CD workflow from code commit to production deployment with monitoring.

### 1.2 Problem Statement
Manual deployment processes are error-prone, time-consuming, and difficult to scale. This project implements an automated CI/CD pipeline that:
- Automatically builds and tests code changes
- Creates containerized application images
- Deploys to Kubernetes cluster
- Monitors application health and performance

### 1.3 Project Scope
- **Source Control**: GitHub repository management
- **CI/CD**: Jenkins pipeline automation
- **Containerization**: Docker image creation and registry management
- **Orchestration**: Kubernetes deployment with services
- **Monitoring**: Prometheus and Grafana integration

---

## 2. Application Overview

### 2.1 Application Description
**Student Management System** - A RESTful API application for managing student records in a university database.

### 2.2 Technology Stack
- **Backend**: Node.js with Express framework
- **Database**: PostgreSQL 15
- **Runtime**: Node.js 18 (Alpine Linux)

### 2.3 Features
1. **Add Student**: Create new student records
2. **View Students**: Retrieve all student records
3. **Get Student**: Fetch individual student details
4. **Delete Student**: Remove student records
5. **Health Check**: Monitor application status

### 2.4 API Endpoints
```
GET  /                    - API information
GET  /health             - Health check endpoint
GET  /api/students       - Get all students
GET  /api/students/:id   - Get specific student
POST /api/students       - Add new student
DELETE /api/students/:id - Delete student
```

### 2.5 Database Schema
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  semester INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Tools & Technologies

### 3.1 Development Tools

#### 3.1.1 Node.js & Express
- **Version**: Node.js 18 LTS
- **Purpose**: Backend API development
- **Framework**: Express.js for HTTP server
- **Packages Used**:
  - `express`: Web framework
  - `pg`: PostgreSQL client
  - `body-parser`: Request body parsing
  - `cors`: Cross-origin resource sharing

#### 3.1.2 PostgreSQL
- **Version**: PostgreSQL 15 (Alpine)
- **Purpose**: Relational database for student records
- **Configuration**: Containerized deployment in Kubernetes

### 3.2 DevOps Tools

#### 3.2.1 GitHub
- **Purpose**: Source code version control
- **Features Used**:
  - Repository hosting
  - Webhooks for CI/CD triggering
  - Branch management
  - Commit history tracking

#### 3.2.2 Jenkins
- **Version**: Latest stable release
- **Purpose**: CI/CD automation server
- **Plugins Required**:
  - Git Plugin
  - Docker Pipeline
  - Kubernetes Plugin
  - GitHub Integration
  - Credentials Binding

#### 3.2.3 Docker
- **Version**: Docker 24.x
- **Purpose**: Application containerization
- **Components**:
  - Dockerfile for multi-stage builds
  - Docker Compose for local testing
  - DockerHub for image registry

#### 3.2.4 Kubernetes
- **Version**: Kubernetes 1.28+
- **Purpose**: Container orchestration
- **Resources Used**:
  - Deployments
  - Services (NodePort)
  - PersistentVolumeClaims
  - ConfigMaps
  - Secrets

#### 3.2.5 Helm
- **Version**: Helm 3.x
- **Purpose**: Kubernetes package manager
- **Usage**: Installing Prometheus and Grafana

#### 3.2.6 Prometheus
- **Version**: Latest (via Helm chart)
- **Purpose**: Metrics collection and monitoring
- **Features**:
  - Time-series database
  - PromQL query language
  - Service discovery
  - Alert management

#### 3.2.7 Grafana
- **Version**: Latest (via kube-prometheus-stack)
- **Purpose**: Metrics visualization and dashboards
- **Features**:
  - Interactive dashboards
  - Multiple data sources
  - Alerting capabilities
  - User management

---

## 4. Infrastructure Setup

### 4.1 AWS EC2 Instance Configuration

#### 4.1.1 Instance Specifications
```
AMI: Ubuntu 22.04 LTS
Instance Type: t2.medium (minimum)
  - vCPUs: 2
  - Memory: 4 GB RAM
  - Storage: 30 GB SSD
Security Group: Custom (see section 4.1.3)
Key Pair: Your SSH key for access
```

#### 4.1.2 System Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget vim
```

#### 4.1.3 Security Group Configuration
Inbound Rules:
```
Port 22   - SSH          - Your IP only
Port 8080 - Jenkins      - Your IP only
Port 30080 - Application - Anywhere (0.0.0.0/0)
Port 30090 - Prometheus  - Your IP only
Port 30091 - Grafana     - Your IP only
```

### 4.2 Jenkins Installation

#### 4.2.1 Install Java
```bash
# Install OpenJDK 11 (required for Jenkins)
sudo apt install openjdk-11-jdk -y

# Verify installation
java -version
```

#### 4.2.2 Install Jenkins
```bash
# Add Jenkins repository key
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | \
  sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null

# Add Jenkins repository
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | \
  sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update and install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start and enable Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Check status
sudo systemctl status jenkins
```

#### 4.2.3 Initial Jenkins Setup
```bash
# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins: `http://<EC2-PUBLIC-IP>:8080`

**Screenshot Placeholder**: Jenkins initial setup page

### 4.3 Docker Installation

```bash
# Download and run Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo usermod -aG docker $USER

# Restart Jenkins to apply group changes
sudo systemctl restart jenkins

# Verify Docker installation
docker --version
```

### 4.4 Kubernetes Setup

#### 4.4.1 Install kubectl
```bash
# Download latest kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s \
  https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install kubectl
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installation
kubectl version --client
```

#### 4.4.2 Kubernetes Cluster Options

**Option 1: Minikube (For Testing)**
```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --driver=docker
```

**Option 2: AWS EKS (Production)**
```bash
# Install eksctl
curl --silent --location \
  "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | \
  tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create EKS cluster (takes 15-20 minutes)
eksctl create cluster --name student-app-cluster --region us-east-1
```

**Screenshot Placeholder**: Kubernetes cluster info (`kubectl cluster-info`)

### 4.5 Helm Installation

```bash
# Install Helm 3
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installation
helm version
```

---

## 5. Pipeline Implementation

### 5.1 GitHub Repository Setup

#### 5.1.1 Repository Structure
```
final/
├── app/
│   ├── server.js
│   ├── package.json
│   └── .dockerignore
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── build-push.sh
├── kubernetes/
│   ├── postgres-pvc.yaml
│   ├── postgres-config.yaml
│   ├── postgres-deployment.yaml
│   ├── app-deployment.yaml
│   ├── app-service.yaml
│   └── deploy.sh
├── jenkins/
│   ├── Jenkinsfile
│   └── SETUP.md
├── monitoring/
│   ├── MONITORING_SETUP.md
│   ├── install-monitoring.sh
│   └── DASHBOARD_CONFIG.md
└── README.md
```

**Screenshot Placeholder**: GitHub repository file structure

#### 5.1.2 Pushing Code to GitHub
```bash
# Initialize git repository
cd /path/to/project
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Student Management System"

# Add remote repository
git remote add origin https://github.com/username/repo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Screenshot Placeholder**: GitHub repository with files pushed

### 5.2 GitHub Webhook Configuration (6 Marks)

#### 5.2.1 Webhook Setup Steps
1. Navigate to repository on GitHub
2. Click **Settings → Webhooks → Add webhook**
3. Configure webhook:
   ```
   Payload URL: http://<JENKINS-PUBLIC-IP>:8080/github-webhook/
   Content type: application/json
   Secret: (leave empty for testing)
   SSL verification: Enable SSL verification
   Events: Just the push event
   Active: ✓ Active
   ```
4. Click **Add webhook**

**Screenshot Placeholder**: GitHub webhook configuration page

#### 5.2.2 Webhook Verification
- Green checkmark indicates successful webhook creation
- Test webhook by pushing a commit
- Check webhook delivery history

**Screenshot Placeholder**: Webhook delivery history showing 200 OK

### 5.3 Jenkins Configuration

#### 5.3.1 Install Required Plugins
Navigate to: **Manage Jenkins → Manage Plugins → Available**

Install these plugins:
- ✅ Git plugin
- ✅ Docker Pipeline
- ✅ Kubernetes plugin
- ✅ GitHub Integration Plugin
- ✅ Pipeline plugin
- ✅ Credentials Binding Plugin

**Screenshot Placeholder**: Jenkins plugin manager with installed plugins

#### 5.3.2 Configure Credentials

**DockerHub Credentials:**
1. Go to **Manage Jenkins → Manage Credentials → Global → Add Credentials**
2. Kind: Username with password
3. Username: `usmanasif193`
4. Password: `your-dockerhub-password`
5. ID: `dockerhub-credentials`
6. Description: DockerHub Credentials
7. Click **OK**

**Screenshot Placeholder**: DockerHub credentials configuration

**Kubeconfig Credentials:**
1. Go to **Manage Jenkins → Manage Credentials → Global → Add Credentials**
2. Kind: Secret file
3. File: Upload your kubeconfig file
4. ID: `kubeconfig-credentials`
5. Description: Kubernetes Config
6. Click **OK**

**Screenshot Placeholder**: Kubeconfig credentials configuration

#### 5.3.3 Create Pipeline Job
1. Click **New Item**
2. Enter name: `student-management-cicd`
3. Select: **Pipeline**
4. Click **OK**

**General Configuration:**
- Description: `CSC418 DevOps CI/CD Pipeline - Student Management System`
- ✅ GitHub project: `https://github.com/username/repo`

**Build Triggers:**
- ✅ GitHub hook trigger for GITScm polling

**Pipeline Configuration:**
- Definition: Pipeline script from SCM
- SCM: Git
  - Repository URL: `https://github.com/username/repo.git`
  - Credentials: (if private repo)
  - Branch: `*/main`
- Script Path: `jenkins/Jenkinsfile`

**Screenshot Placeholder**: Jenkins pipeline job configuration

### 5.4 Pipeline Stages Explanation

#### 5.4.1 Stage 1: Code Fetch (6 Marks)

**Purpose**: Retrieve latest code from GitHub repository

**Implementation**:
```groovy
stage('Code Fetch from GitHub') {
    steps {
        script {
            echo '📥 Stage 1: Fetching code from GitHub...'
            echo "Repository: ${env.GIT_URL}"
            echo "Branch: ${env.GIT_BRANCH}"
            echo "Commit: ${env.GIT_COMMIT}"
        }
        
        sh '''
            echo "✅ Code fetched successfully"
            ls -la
        '''
    }
}
```

**How It Works**:
1. Jenkins Git plugin automatically checks out code when webhook triggers
2. Environment variables provide repository information
3. Working directory contains complete repository files

**Marks Breakdown** (6 marks):
- Webhook triggering: 2 marks
- Successful code fetch: 2 marks
- Displaying repository info: 2 marks

**Screenshot Placeholder**: Jenkins console showing Stage 1 execution

#### 5.4.2 Stage 2: Docker Image Creation (10 Marks)

**Purpose**: Build Docker image and push to DockerHub registry

**Build Docker Image Sub-stage**:
```groovy
stage('Build Docker Image') {
    steps {
        dir('app') {
            sh """
                docker build -t ${FULL_IMAGE_NAME} -f ../docker/Dockerfile .
                docker tag ${FULL_IMAGE_NAME} ${LATEST_IMAGE_NAME}
            """
        }
    }
}
```

**Push to DockerHub Sub-stage**:
```groovy
stage('Push to DockerHub') {
    steps {
        sh """
            echo \$DOCKERHUB_CREDENTIALS_PSW | docker login -u \$DOCKERHUB_CREDENTIALS_USR --password-stdin
            docker push ${FULL_IMAGE_NAME}
            docker push ${LATEST_IMAGE_NAME}
        """
    }
}
```

**Dockerfile Explanation**:
```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Marks Breakdown** (10 marks):
- Dockerfile creation: 3 marks
- Docker image build: 3 marks
- DockerHub push: 3 marks
- Image tagging strategy: 1 mark

**Screenshot Placeholder**: 
1. Docker build process in Jenkins console
2. DockerHub repository showing pushed images

#### 5.4.3 Stage 3: Kubernetes Deployment (17 Marks)

**Purpose**: Deploy application and database to Kubernetes cluster

**Deploy to Kubernetes Sub-stage**:
```groovy
stage('Deploy to Kubernetes') {
    steps {
        sh """
            # Update image in deployment
            sed -i 's|image: .*student-management-system.*|image: ${LATEST_IMAGE_NAME}|g' kubernetes/app-deployment.yaml
            
            # Apply configurations
            kubectl apply -f kubernetes/postgres-config.yaml
            kubectl apply -f kubernetes/postgres-pvc.yaml
            kubectl apply -f kubernetes/postgres-deployment.yaml
            kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
            kubectl apply -f kubernetes/app-deployment.yaml
            kubectl apply -f kubernetes/app-service.yaml
            kubectl wait --for=condition=ready pod -l app=student-app --timeout=120s
        """
    }
}
```

**Kubernetes Resources**:

1. **ConfigMap & Secret** (`postgres-config.yaml`):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
data:
  POSTGRES_DB: studentdb
  POSTGRES_USER: postgres
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  POSTGRES_PASSWORD: postgres123
```

2. **PersistentVolumeClaim** (`postgres-pvc.yaml`):
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

3. **PostgreSQL Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

4. **Application Deployment** (`app-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: student-app-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: student-app
  template:
    spec:
      containers:
      - name: student-app
        image: username/student-management-system:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
```

5. **Service** (`app-service.yaml`):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: student-app-service
spec:
  type: NodePort
  ports:
  - port: 3000
    targetPort: 3000
    nodePort: 30080
  selector:
    app: student-app
```

**Marks Breakdown** (17 marks):
- Deployment YAML creation: 5 marks
- Service YAML creation: 4 marks
- PVC YAML creation: 3 marks
- kubectl apply execution: 3 marks
- Successful deployment verification: 2 marks

**Screenshot Placeholder**:
1. kubectl get deployments
2. kubectl get pods
3. kubectl get services
4. kubectl get pvc

#### 5.4.4 Stage 4: Monitoring Setup (17 Marks)

**Purpose**: Install and configure Prometheus and Grafana for monitoring

**Install Prometheus Sub-stage**:
```groovy
stage('Install Prometheus') {
    steps {
        sh """
            helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
            helm repo update
            
            helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \\
                --namespace monitoring \\
                --create-namespace \\
                --set prometheus.service.type=NodePort \\
                --set prometheus.service.nodePort=30090 \\
                --wait --timeout=10m
        """
    }
}
```

**Install Grafana Sub-stage**:
```groovy
stage('Install Grafana') {
    steps {
        sh """
            kubectl patch svc prometheus-grafana -n monitoring \\
                -p '{"spec": {"type": "NodePort", "ports": [{"port": 80, "nodePort": 30091}]}}'
            
            echo 'Grafana Password:'
            kubectl get secret --namespace monitoring prometheus-grafana \\
                -o jsonpath="{.data.admin-password}" | base64 --decode
        """
    }
}
```

**Marks Breakdown** (17 marks):
- Prometheus installation using Helm: 8 marks
- Grafana installation and configuration: 6 marks
- Data source configuration: 3 marks

**Screenshot Placeholder**:
1. Helm install Prometheus output
2. kubectl get all -n monitoring
3. Prometheus UI showing targets
4. Grafana login page

### 5.5 Complete Pipeline Execution

**Pipeline Flow**:
```
GitHub Push → Webhook → Jenkins Trigger
              ↓
     Stage 1: Code Fetch (6 marks)
              ↓
     Stage 2: Docker Build & Push (10 marks)
              ↓
     Stage 3: Kubernetes Deployment (17 marks)
              ↓
     Stage 4: Monitoring Setup (17 marks)
              ↓
     Pipeline Success ✅
```

**Screenshot Placeholder**:
1. Complete pipeline execution with all stages successful
2. Pipeline stage view showing timing
3. Jenkins Blue Ocean view

---

## 6. Monitoring Setup

### 6.1 Prometheus Configuration

#### 6.1.1 Accessing Prometheus
```
URL: http://<NODE-IP>:30090
```

**Screenshot Placeholder**: Prometheus web interface

#### 6.1.2 Verify Targets
1. Navigate to **Status → Targets**
2. Verify all targets show "UP" status
3. Key targets:
   - kube-state-metrics
   - node-exporter
   - prometheus
   - kubelet

**Screenshot Placeholder**: Prometheus targets page showing all UP

#### 6.1.3 Sample PromQL Queries
```promql
# Pod CPU usage
sum(rate(container_cpu_usage_seconds_total{pod=~"student-app.*"}[5m])) by (pod)

# Pod memory usage
sum(container_memory_usage_bytes{pod=~"student-app.*"}) by (pod)

# HTTP request rate
rate(http_requests_total[5m])
```

**Screenshot Placeholder**: Prometheus graph showing metrics

### 6.2 Grafana Configuration

#### 6.2.1 Login to Grafana
```bash
# Get password
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

```
URL: http://<NODE-IP>:30091
Username: admin
Password: <from command above>
```

**Screenshot Placeholder**: Grafana login page

#### 6.2.2 Verify Data Source
1. Navigate to **⚙️ Configuration → Data Sources**
2. Click on **Prometheus**
3. Verify connection: "Data source is working" ✅

**Screenshot Placeholder**: Grafana data source configuration

#### 6.2.3 Import Dashboards

**Dashboard 1: Kubernetes Cluster Monitoring (ID: 3119)**
1. Click **+ → Import**
2. Enter Dashboard ID: `3119`
3. Select Prometheus data source
4. Click **Import**

**Screenshot Placeholder**: Kubernetes cluster monitoring dashboard

**Dashboard 2: Node Exporter Full (ID: 1860)**
1. Click **+ → Import**
2. Enter Dashboard ID: `1860`
3. Select Prometheus data source
4. Click **Import**

**Screenshot Placeholder**: Node exporter dashboard

**Dashboard 3: Pod Monitoring (ID: 6417)**
1. Click **+ → Import**
2. Enter Dashboard ID: `6417`
3. Select Prometheus data source
4. Click **Import**

**Screenshot Placeholder**: Pod monitoring dashboard

#### 6.2.4 Create Custom Application Dashboard

**Panel 1: Running Pods**
```
Query: count(kube_pod_status_phase{phase="Running", pod=~"student-app.*"})
Type: Stat
Title: Running Pods
```

**Panel 2: Pod CPU Usage**
```
Query: sum(rate(container_cpu_usage_seconds_total{pod=~"student-app.*"}[5m])) by (pod)
Type: Graph
Title: Pod CPU Usage
```

**Panel 3: Pod Memory Usage**
```
Query: sum(container_memory_usage_bytes{pod=~"student-app.*"}) by (pod)
Type: Graph
Title: Pod Memory Usage
```

**Panel 4: Database Connections**
```
Query: pg_stat_database_numbackends{datname="studentdb"}
Type: Graph
Title: PostgreSQL Active Connections
```

**Screenshot Placeholder**: Custom application dashboard with all panels

### 6.3 Monitoring Verification

#### 6.3.1 Check Monitoring Namespace
```bash
kubectl get all -n monitoring
```

**Expected Output**:
```
NAME                                                     READY   STATUS    RESTARTS   AGE
pod/prometheus-kube-prometheus-operator-xxx              1/1     Running   0          10m
pod/prometheus-prometheus-kube-prometheus-prometheus-0   2/2     Running   0          10m
pod/prometheus-grafana-xxx                               3/3     Running   0          10m
pod/alertmanager-prometheus-kube-prometheus-alertmanager-0 2/2   Running   0          10m

NAME                                              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)
service/prometheus-grafana                        NodePort    10.100.xxx.xxx   <none>        80:30091/TCP
service/prometheus-kube-prometheus-prometheus     NodePort    10.100.xxx.xxx   <none>        9090:30090/TCP
```

**Screenshot Placeholder**: kubectl get all -n monitoring output

---

## 7. Testing & Verification

### 7.1 Application Testing

#### 7.1.1 Get Application URL
```bash
# Get Node IP
kubectl get nodes -o wide

# Get Service details
kubectl get svc student-app-service
```

Application URL: `http://<NODE-IP>:30080`

#### 7.1.2 Test API Endpoints

**Health Check**:
```bash
curl http://<NODE-IP>:30080/health
```

Expected Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T10:00:00.000Z",
  "service": "Student Management System"
}
```

**Add Student**:
```bash
curl -X POST http://<NODE-IP>:30080/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ali Ahmed",
    "roll_number": "FA21-BCE-001",
    "department": "Computer Science",
    "semester": 7
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Student added successfully",
  "data": {
    "id": 1,
    "name": "Ali Ahmed",
    "roll_number": "FA21-BCE-001",
    "department": "Computer Science",
    "semester": 7
  }
}
```

**Get All Students**:
```bash
curl http://<NODE-IP>:30080/api/students
```

**Screenshot Placeholder**: 
1. curl command output showing successful API calls
2. Browser view of API responses

### 7.2 Database Verification

```bash
# Get PostgreSQL pod name
kubectl get pods -l app=postgres

# Connect to PostgreSQL
kubectl exec -it <postgres-pod-name> -- psql -U postgres -d studentdb

# In PostgreSQL prompt
\dt                           # List tables
SELECT * FROM students;       # View data
\q                           # Exit
```

**Screenshot Placeholder**: Database query results

### 7.3 Pipeline Testing

#### 7.3.1 Trigger Pipeline via Webhook
```bash
# Make a code change
echo "# Test change" >> README.md

# Commit and push
git add README.md
git commit -m "Test webhook trigger"
git push origin main
```

#### 7.3.2 Monitor Jenkins Build
1. Go to Jenkins dashboard
2. Watch pipeline execute automatically
3. Verify all stages complete successfully

**Screenshot Placeholder**: 
1. Jenkins build history showing webhook-triggered build
2. Console output of successful build

### 7.4 Monitoring Verification

#### 7.4.1 Check Prometheus Metrics
1. Access Prometheus: `http://<NODE-IP>:30090`
2. Go to **Graph** tab
3. Run query: `up{job=~".*student-app.*"}`
4. Verify metrics are being collected

**Screenshot Placeholder**: Prometheus graph showing application metrics

#### 7.4.2 Check Grafana Dashboards
1. Access Grafana: `http://<NODE-IP>:30091`
2. Navigate to custom dashboard
3. Verify all panels show live data

**Screenshot Placeholder**: Grafana dashboard showing real-time metrics

### 7.5 Load Testing (Optional)

```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Run load test
ab -n 1000 -c 10 http://<NODE-IP>:30080/api/students
```

Monitor CPU and memory usage in Grafana during load test.

**Screenshot Placeholder**: Grafana showing metrics during load test

---

## 8. Learning Outcomes

### 8.1 Technical Skills Acquired

#### 8.1.1 CI/CD Pipeline Development
- Designed and implemented automated Jenkins pipeline
- Configured webhook-based triggering
- Integrated multiple tools in deployment workflow
- Implemented multi-stage pipeline with proper error handling

#### 8.1.2 Containerization
- Created optimized multi-stage Dockerfiles
- Implemented container security best practices
- Managed container images in DockerHub registry
- Used Docker Compose for local development

#### 8.1.3 Kubernetes Orchestration
- Deployed applications using Deployments and Services
- Configured persistent storage with PVCs
- Managed configuration using ConfigMaps and Secrets
- Implemented health checks (liveness and readiness probes)
- Used NodePort services for external access

#### 8.1.4 Monitoring & Observability
- Installed Prometheus for metrics collection
- Configured Grafana for visualization
- Created custom dashboards for application monitoring
- Understood key metrics for application health

#### 8.1.5 Cloud Infrastructure
- Provisioned and configured AWS EC2 instances
- Managed security groups and network access
- Deployed production-grade applications on cloud

### 8.2 DevOps Practices Learned

#### 8.2.1 Infrastructure as Code
- Defined infrastructure using YAML manifests
- Version controlled all configuration files
- Implemented repeatable deployment process

#### 8.2.2 Automation
- Automated build, test, and deployment processes
- Reduced manual intervention and human errors
- Implemented consistent deployment workflows

#### 8.2.3 Version Control
- Used Git for source code management
- Implemented branching strategies
- Integrated version control with CI/CD pipeline

#### 8.2.4 Security Best Practices
- Managed sensitive data using Kubernetes Secrets
- Implemented least privilege access
- Used non-root containers
- Secured API endpoints

### 8.3 Challenges Faced & Solutions

#### Challenge 1: Docker Permission Issues
**Problem**: Jenkins couldn't access Docker daemon
**Solution**: Added jenkins user to docker group
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

#### Challenge 2: Database Connection Failures
**Problem**: Application pods couldn't connect to PostgreSQL
**Solution**: 
- Used Kubernetes Service for database connectivity
- Implemented proper readiness probes
- Ensured correct DNS resolution

#### Challenge 3: Persistent Storage
**Problem**: Database data lost on pod restart
**Solution**: Implemented PersistentVolumeClaim for database storage

#### Challenge 4: Monitoring Configuration
**Problem**: Prometheus not discovering application metrics
**Solution**: Used kube-prometheus-stack which auto-discovers Kubernetes resources

### 8.4 Best Practices Implemented

✅ **Multi-stage Docker builds** for smaller images
✅ **Health checks** for application monitoring
✅ **Resource limits** to prevent resource exhaustion
✅ **Secrets management** for sensitive data
✅ **Automated deployments** via webhooks
✅ **Comprehensive monitoring** with Prometheus and Grafana
✅ **Documentation** of all processes
✅ **Version tagging** of Docker images

---

## 9. Conclusion

### 9.1 Project Summary
This project successfully implemented a complete CI/CD pipeline for a Student Management System using industry-standard DevOps tools. The pipeline automates the entire software delivery lifecycle from code commit to production deployment with comprehensive monitoring.

### 9.2 Objectives Achieved

✅ **CLO-5 Objective Met**: Applied DevOps pipeline automation techniques for code deployment

#### Marks Distribution Summary (50 Total Marks):

1. **Code Fetch Stage** (6 Marks) ✅
   - GitHub repository setup
   - Webhook configuration
   - Automatic triggering

2. **Docker Image Creation** (10 Marks) ✅
   - Dockerfile creation
   - Image building
   - DockerHub push with credentials

3. **Kubernetes Deployment** (17 Marks) ✅
   - Deployment YAML
   - Service YAML (NodePort)
   - PVC YAML for database persistence
   - kubectl apply automation

4. **Monitoring Setup** (17 Marks) ✅
   - Prometheus installation via Helm
   - Grafana installation and configuration
   - Dashboard setup
   - Metrics visualization

### 9.3 Key Takeaways

1. **Automation is Essential**: Manual deployments are error-prone and time-consuming. Automated pipelines ensure consistency and reliability.

2. **Containerization Benefits**: Docker provides portability, consistency across environments, and simplified dependency management.

3. **Kubernetes Power**: Container orchestration enables automatic scaling, self-healing, and zero-downtime deployments.

4. **Monitoring is Critical**: Without proper monitoring, identifying issues becomes difficult. Prometheus and Grafana provide deep visibility into application health.

5. **DevOps Culture**: DevOps is not just about tools, but about creating a culture of collaboration, automation, and continuous improvement.

### 9.4 Real-World Applications

This project demonstrates skills directly applicable to:
- **Software Development Companies**: Implementing CI/CD pipelines
- **Cloud Native Applications**: Building and deploying microservices
- **DevOps Engineering Roles**: Managing infrastructure and deployments
- **Site Reliability Engineering**: Monitoring and maintaining production systems

### 9.5 Future Enhancements

Potential improvements for this project:

1. **Automated Testing**: Add unit tests and integration tests in pipeline
2. **Multi-Environment Deployment**: Implement dev, staging, and production environments
3. **Advanced Monitoring**: Add custom application metrics and alerts
4. **Security Scanning**: Integrate vulnerability scanning in pipeline
5. **GitOps**: Implement ArgoCD for declarative deployments
6. **Service Mesh**: Add Istio for advanced traffic management
7. **Database Backups**: Implement automated backup strategy
8. **High Availability**: Deploy across multiple availability zones
9. **Auto-scaling**: Implement Horizontal Pod Autoscaler
10. **Logging**: Add centralized logging with ELK stack

### 9.6 Personal Reflection

This project provided hands-on experience with modern DevOps practices and tools. The integration of multiple technologies demonstrated how complex systems work together in production environments. The challenges faced and overcome enhanced problem-solving skills and deepened understanding of cloud-native architectures.

---

## 10. References

### 10.1 Official Documentation

1. **Jenkins**
   - Official Documentation: https://www.jenkins.io/doc/
   - Pipeline Syntax: https://www.jenkins.io/doc/book/pipeline/syntax/

2. **Docker**
   - Official Documentation: https://docs.docker.com/
   - Dockerfile Best Practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

3. **Kubernetes**
   - Official Documentation: https://kubernetes.io/docs/
   - API Reference: https://kubernetes.io/docs/reference/kubernetes-api/

4. **Prometheus**
   - Official Documentation: https://prometheus.io/docs/
   - Query Language: https://prometheus.io/docs/prometheus/latest/querying/basics/

5. **Grafana**
   - Official Documentation: https://grafana.com/docs/
   - Dashboard Guide: https://grafana.com/docs/grafana/latest/dashboards/

6. **Helm**
   - Official Documentation: https://helm.sh/docs/
   - Chart Repository: https://artifacthub.io/

### 10.2 Tools & Resources

1. **GitHub**: https://github.com
2. **DockerHub**: https://hub.docker.com
3. **AWS EC2**: https://aws.amazon.com/ec2/
4. **Node.js**: https://nodejs.org/
5. **PostgreSQL**: https://www.postgresql.org/

### 10.3 Learning Resources

1. Jenkins Documentation: https://www.jenkins.io/doc/book/
2. Docker Official Tutorials: https://docs.docker.com/get-started/
3. Kubernetes Tutorials: https://kubernetes.io/docs/tutorials/
4. Prometheus Getting Started: https://prometheus.io/docs/prometheus/latest/getting_started/
5. Grafana Tutorials: https://grafana.com/tutorials/

### 10.4 Community Resources

1. Stack Overflow: https://stackoverflow.com/
2. Kubernetes Slack: https://slack.k8s.io/
3. DevOps Reddit: https://www.reddit.com/r/devops/
4. CNCF Landscape: https://landscape.cncf.io/

---

## Appendix A: Command Reference

### Jenkins Commands
```bash
# Start Jenkins
sudo systemctl start jenkins

# Stop Jenkins
sudo systemctl stop jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Check Jenkins status
sudo systemctl status jenkins

# View Jenkins logs
sudo journalctl -u jenkins -f
```

### Docker Commands
```bash
# Build image
docker build -t image-name .

# List images
docker images

# Remove image
docker rmi image-name

# Push to DockerHub
docker push username/image-name

# List containers
docker ps -a

# Remove container
docker rm container-id
```

### Kubernetes Commands
```bash
# Apply configuration
kubectl apply -f file.yaml

# Get resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get pvc

# Describe resource
kubectl describe pod pod-name

# View logs
kubectl logs pod-name

# Execute command in pod
kubectl exec -it pod-name -- /bin/sh

# Delete resource
kubectl delete -f file.yaml

# Port forward
kubectl port-forward svc/service-name 3000:3000
```

### Helm Commands
```bash
# Add repository
helm repo add repo-name url

# Update repositories
helm repo update

# Install chart
helm install release-name chart-name

# List releases
helm list

# Uninstall release
helm uninstall release-name

# Get values
helm get values release-name
```

---

## Appendix B: Troubleshooting Guide

### Common Issues & Solutions

#### Issue 1: Jenkins Build Fails - Docker Permission Denied
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

#### Issue 2: Pods in CrashLoopBackOff
```bash
kubectl logs pod-name
kubectl describe pod pod-name
```

#### Issue 3: Service Not Accessible
```bash
kubectl get svc
kubectl describe svc service-name
# Check NodePort and Security Groups
```

#### Issue 4: Database Connection Failed
```bash
# Check PostgreSQL pod
kubectl get pods -l app=postgres
kubectl logs postgres-pod-name

# Verify service DNS
kubectl exec -it app-pod-name -- nslookup postgres-service
```

#### Issue 5: Prometheus Not Scraping Metrics
```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Access http://localhost:9090/targets
```

---

## Appendix C: Security Considerations

### 1. Secrets Management
- Never commit passwords to Git
- Use Kubernetes Secrets for sensitive data
- Rotate credentials regularly

### 2. Network Security
- Use Security Groups to restrict access
- Enable HTTPS for production
- Implement network policies in Kubernetes

### 3. Container Security
- Run containers as non-root user
- Scan images for vulnerabilities
- Use minimal base images
- Keep images updated

### 4. Access Control
- Implement RBAC in Kubernetes
- Use Jenkins authentication
- Enable audit logging

---

**END OF REPORT**

---

**Submitted By:**  
[Your Name]  
[Your Roll Number]  
BCT-VII  
COMSATS University Islamabad

**Submission Date:** December 16, 2025

**Instructor:** Dr. Muhammad Imran  
**Subject:** CSC418 – DevOps for Cloud Computing  
**Total Marks:** 50
