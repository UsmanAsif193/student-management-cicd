# Quick Start Guide - CSC418 DevOps Project

This guide provides step-by-step instructions to get your CI/CD pipeline up and running quickly.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS account with EC2 access
- [ ] GitHub account
- [ ] DockerHub account
- [ ] SSH client installed
- [ ] Git installed locally
- [ ] Code editor (VS Code recommended)

---

## Phase 1: AWS EC2 Setup (30 minutes)

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Configure Instance:**
   ```
   Name: jenkins-devops-server
   AMI: Ubuntu Server 22.04 LTS
   Instance Type: t2.medium (2 vCPU, 4 GB RAM)
   Key Pair: Create new or use existing
   ```

3. **Security Group:**
   - Create new security group: `devops-sg`
   - Add these inbound rules:
     ```
     SSH       - Port 22    - Your IP
     Custom    - Port 8080  - Your IP (Jenkins)
     Custom    - Port 30080 - 0.0.0.0/0 (Application)
     Custom    - Port 30090 - Your IP (Prometheus)
     Custom    - Port 30091 - Your IP (Grafana)
     ```

4. **Storage:** 30 GB gp3

5. **Launch instance** and note the Public IP

### Step 2: Connect to EC2

```bash
# SSH into instance
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>

# Update system
sudo apt update && sudo apt upgrade -y
```

---

## Phase 2: Install Prerequisites (20 minutes)

### Install Everything at Once

Copy and run this complete installation script:

```bash
#!/bin/bash
# Complete DevOps Tools Installation Script

echo "🚀 Installing DevOps Tools..."

# Update system
sudo apt update

# 1. Install Java
echo "📦 Installing Java..."
sudo apt install openjdk-11-jdk -y

# 2. Install Jenkins
echo "📦 Installing Jenkins..."
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

# 3. Install Docker
echo "📦 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker jenkins
sudo usermod -aG docker ubuntu

# 4. Install kubectl
echo "📦 Installing kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# 5. Install Helm
echo "📦 Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 6. Install Minikube (for testing)
echo "📦 Installing Minikube..."
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Restart Jenkins
sudo systemctl restart jenkins

echo "✅ Installation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Get Jenkins password: sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
echo "2. Access Jenkins: http://$(curl -s ifconfig.me):8080"
echo "3. Start Minikube: minikube start --driver=docker"
```

Save this as `install.sh` and run:
```bash
chmod +x install.sh
./install.sh
```

### Get Jenkins Password

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Start Kubernetes (Minikube)

```bash
minikube start --driver=docker
kubectl cluster-info
```

---

## Phase 3: Setup GitHub Repository (10 minutes)

### Step 1: Create Repository on GitHub

1. Go to GitHub.com
2. Click **New repository**
3. Name: `student-management-cicd`
4. Visibility: Public
5. Click **Create repository**

### Step 2: Clone This Project

On your **local machine**:

```bash
# Clone the project (replace with your actual path)
cd ~/Documents/Uni/cloud-computing/final

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Student Management CI/CD Project"

# Add remote
git remote add origin https://github.com/usmanasif193/student-management-cicd.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Update Configuration Files

**Important:** Before pushing, update these files:

1. **docker/Dockerfile** - Line 3:
   ```
   Change: usmanasif193
   To: YOUR-ACTUAL-DOCKERHUB-USERNAME
   ```

2. **kubernetes/app-deployment.yaml** - Line 14:
   ```
   Change: usmanasif193
   To: YOUR-ACTUAL-DOCKERHUB-USERNAME
   ```

3. **jenkins/Jenkinsfile** - Line 6:
   ```
   Change: usmanasif193
   To: YOUR-ACTUAL-DOCKERHUB-USERNAME
   ```

---

## Phase 4: Configure Jenkins (15 minutes)

### Step 1: Initial Setup

1. Access Jenkins: `http://<EC2-PUBLIC-IP>:8080`
2. Paste the initial admin password
3. Click **Install suggested plugins**
4. Create admin user
5. Save and Continue

### Step 2: Install Required Plugins

1. Go to **Manage Jenkins → Manage Plugins → Available**
2. Search and install:
   - Git plugin
   - Docker Pipeline
   - Kubernetes plugin
   - GitHub Integration Plugin
3. Click **Install without restart**

### Step 3: Add DockerHub Credentials

1. Go to **Manage Jenkins → Manage Credentials**
2. Click **Global → Add Credentials**
3. Configure:
   ```
   Kind: Username with password
   Username: usmanasif193
   Password: YOUR-DOCKERHUB-PASSWORD
   ID: dockerhub-credentials
   Description: DockerHub Credentials
   ```
4. Click **OK**

### Step 4: Add Kubeconfig

1. On EC2, copy kubeconfig:
   ```bash
   cat ~/.kube/config
   ```

2. In Jenkins: **Manage Jenkins → Manage Credentials → Add Credentials**
   ```
   Kind: Secret file
   File: Upload kubeconfig (or paste content)
   ID: kubeconfig-credentials
   Description: Kubernetes Config
   ```

### Step 5: Create Pipeline Job

1. Click **New Item**
2. Name: `student-management-cicd`
3. Type: **Pipeline**
4. Click **OK**

5. **Configure Job:**
   - Description: `CSC418 DevOps CI/CD Pipeline`
   - ✅ GitHub project: `https://github.com/YOUR-USERNAME/student-management-cicd`
   - ✅ GitHub hook trigger for GITScm polling
   
6. **Pipeline Section:**
   ```
   Definition: Pipeline script from SCM
   SCM: Git
   Repository URL: https://github.com/YOUR-USERNAME/student-management-cicd.git
   Branch: */main
   Script Path: jenkins/Jenkinsfile
   ```

7. Click **Save**

---

## Phase 5: Setup GitHub Webhook (5 minutes)

1. Go to your GitHub repository
2. Click **Settings → Webhooks → Add webhook**
3. Configure:
   ```
   Payload URL: http://<EC2-PUBLIC-IP>:8080/github-webhook/
   Content type: application/json
   Events: Just the push event
   Active: ✓
   ```
4. Click **Add webhook**
5. Verify green checkmark appears

---

## Phase 6: First Build (5 minutes)

### Test Manual Build

1. Go to Jenkins job
2. Click **Build Now**
3. Click on build number (#1)
4. Click **Console Output**
5. Watch the build progress

**Expected stages:**
- ✅ Code Fetch from GitHub
- ✅ Build Docker Image
- ✅ Push to DockerHub
- ✅ Deploy to Kubernetes
- ✅ Install Prometheus
- ✅ Install Grafana

### Test Webhook Trigger

```bash
# On local machine
cd student-management-cicd
echo "# Test webhook" >> README.md
git add README.md
git commit -m "Test webhook trigger"
git push origin main

# Jenkins should start building automatically!
```

---

## Phase 7: Verify Deployment (10 minutes)

### Check Kubernetes

```bash
# On EC2 instance
kubectl get all

# Expected output:
# - 2 student-app pods running
# - 1 postgres pod running
# - Services created
```

### Test Application

```bash
# Get Node IP
NODE_IP=$(minikube ip)

# Test health
curl http://$NODE_IP:30080/health

# Add a student
curl -X POST http://$NODE_IP:30080/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "roll_number": "FA21-BCE-001",
    "department": "Computer Science",
    "semester": 7
  }'

# Get all students
curl http://$NODE_IP:30080/api/students
```

### Access Application in Browser

```bash
# Get Minikube service URL
minikube service student-app-service --url

# Or use kubectl port-forward
kubectl port-forward svc/student-app-service 3000:3000

# Access: http://<EC2-IP>:3000 (configure security group for port 3000)
```

---

## Phase 8: Setup Monitoring (10 minutes)

### Access Prometheus

```bash
# Get monitoring resources
kubectl get all -n monitoring

# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Access from EC2 public IP on port 9090 (configure security group)
```

### Access Grafana

```bash
# Get Grafana password
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
echo

# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80

# Access: http://<EC2-IP>:3001
# Username: admin
# Password: <from command above>
```

### Import Dashboards

1. Login to Grafana
2. Click **+ → Import**
3. Enter Dashboard ID: `3119` (Kubernetes Cluster)
4. Select Prometheus data source
5. Click **Import**
6. Repeat for dashboards: `1860`, `6417`

---

## Phase 9: Take Screenshots (15 minutes)

For your lab report, capture these screenshots:

### Jenkins (10 screenshots)
1. ✅ Jenkins dashboard with job
2. ✅ Successful build (#1)
3. ✅ Build console output showing all stages
4. ✅ Stage view with timing
5. ✅ GitHub webhook trigger showing build #2
6. ✅ DockerHub credentials configuration
7. ✅ Pipeline configuration page
8. ✅ Webhook delivery on GitHub
9. ✅ Blue Ocean pipeline view (optional)
10. ✅ Jenkins plugins page

### Docker & DockerHub (3 screenshots)
11. ✅ DockerHub repository page
12. ✅ Docker images with tags
13. ✅ Docker build process in console

### Kubernetes (8 screenshots)
14. ✅ kubectl get pods
15. ✅ kubectl get services
16. ✅ kubectl get deployments
17. ✅ kubectl get pvc
18. ✅ kubectl describe deployment
19. ✅ Pod logs showing application start
20. ✅ Application running in browser
21. ✅ API response (Postman or curl)

### Monitoring (6 screenshots)
22. ✅ Prometheus UI
23. ✅ Prometheus targets page (all UP)
24. ✅ Grafana login page
25. ✅ Grafana data source configuration
26. ✅ Kubernetes cluster dashboard
27. ✅ Custom application dashboard

### GitHub (3 screenshots)
28. ✅ GitHub repository structure
29. ✅ Webhook configuration
30. ✅ Webhook delivery history

---

## Phase 10: Final Testing (10 minutes)

### Complete End-to-End Test

```bash
# 1. Make code change
cd app/
echo "// Version 2.0" >> server.js

# 2. Commit and push
git add .
git commit -m "Update: Version 2.0"
git push origin main

# 3. Watch Jenkins automatically build

# 4. Verify new deployment
kubectl get pods -w

# 5. Test application
NODE_IP=$(minikube ip)
curl http://$NODE_IP:30080/health

# 6. Check Grafana for updated metrics
```

---

## Troubleshooting Quick Fixes

### Jenkins can't access Docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Pods not starting
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Can't access application
```bash
# Check service
kubectl get svc

# Check if pods are ready
kubectl get pods

# Use port-forward
kubectl port-forward svc/student-app-service 3000:3000
```

### Webhook not working
```bash
# Check Jenkins logs
sudo journalctl -u jenkins -f

# Verify webhook URL ends with /github-webhook/
# Check GitHub webhook delivery status
```

---

## Success Checklist

Before proceeding to report, verify:

- [ ] EC2 instance running
- [ ] All tools installed
- [ ] Jenkins accessible on port 8080
- [ ] DockerHub credentials working
- [ ] GitHub webhook triggering builds
- [ ] Application accessible on NodePort 30080
- [ ] Prometheus accessible on port 30090
- [ ] Grafana accessible on port 30091
- [ ] All pods running
- [ ] All services created
- [ ] All 30 screenshots captured
- [ ] Lab report ready

---

## Complete Setup Time

- **Total estimated time:** ~2 hours
- **Phase 1-5:** 1 hour (Infrastructure & Configuration)
- **Phase 6-8:** 30 minutes (Testing & Monitoring)
- **Phase 9-10:** 30 minutes (Screenshots & Documentation)

---

## Next Steps

1. ✅ Complete the lab report using `docs/LAB_REPORT.md` as template
2. ✅ Insert all screenshots with captions
3. ✅ Review and proofread
4. ✅ Export as PDF
5. ✅ Submit before deadline

---

## Support & Resources

- **Jenkins Documentation:** https://www.jenkins.io/doc/
- **Kubernetes Docs:** https://kubernetes.io/docs/
- **Docker Docs:** https://docs.docker.com/
- **Project README:** See `README.md`
- **Detailed Setup:** See `jenkins/SETUP.md`
- **Testing Guide:** See `docs/TESTING_GUIDE.md`

---

**You're all set! 🚀**

Your complete CI/CD pipeline is now running!
