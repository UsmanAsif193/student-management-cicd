# Jenkins Setup Guide - CSC418 DevOps Project

## Prerequisites Installation on AWS EC2 (Ubuntu 22.04)

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Java (Required for Jenkins)
```bash
sudo apt install openjdk-11-jdk -y
java -version
```

### 3. Install Jenkins
```bash
# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Check status
sudo systemctl status jenkins
```

### 4. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add Jenkins user to docker group
sudo usermod -aG docker jenkins
sudo usermod -aG docker $USER

# Restart Jenkins
sudo systemctl restart jenkins

# Verify Docker
docker --version
```

### 5. Install kubectl
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

### 6. Install Helm
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### 7. Access Jenkins
```bash
# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins: `http://<EC2-PUBLIC-IP>:8080`

## Jenkins Configuration

### 1. Install Required Plugins
Navigate to: **Manage Jenkins → Manage Plugins → Available**

Install:
- ✅ Git plugin
- ✅ Docker Pipeline
- ✅ Kubernetes plugin
- ✅ GitHub Integration Plugin
- ✅ Pipeline plugin
- ✅ Credentials Binding Plugin

### 2. Add DockerHub Credentials
1. Go to: **Manage Jenkins → Manage Credentials → Global → Add Credentials**
2. Select: **Username with password**
3. Enter:
   - Username: Your DockerHub username
   - Password: Your DockerHub password
   - ID: `dockerhub-credentials`
   - Description: DockerHub Credentials

### 3. Add Kubeconfig (if using external cluster)
1. Go to: **Manage Jenkins → Manage Credentials → Global → Add Credentials**
2. Select: **Secret file**
3. Upload your kubeconfig file
4. ID: `kubeconfig-credentials`

### 4. Configure Global Tools
Go to: **Manage Jenkins → Global Tool Configuration**

**Docker:**
- Name: docker
- Install automatically: ✅

**Git:**
- Name: Default
- Path to Git executable: git

## Create Jenkins Pipeline Job

### 1. Create New Job
1. Click **New Item**
2. Enter name: `student-management-cicd`
3. Select: **Pipeline**
4. Click **OK**

### 2. Configure General Settings
- Description: `CSC418 DevOps CI/CD Pipeline - Student Management System`
- ✅ GitHub project: `https://github.com/your-username/your-repo`

### 3. Configure Build Triggers
✅ **GitHub hook trigger for GITScm polling**

### 4. Configure Pipeline
- Definition: **Pipeline script from SCM**
- SCM: **Git**
  - Repository URL: `https://github.com/your-username/your-repo.git`
  - Credentials: (Add if private repo)
  - Branch: `*/main` or `*/master`
- Script Path: `jenkins/Jenkinsfile`

### 5. Save Configuration

## Setup GitHub Webhook

### 1. Get Jenkins Webhook URL
```
http://<JENKINS-PUBLIC-IP>:8080/github-webhook/
```

### 2. Configure in GitHub
1. Go to your repository on GitHub
2. Click **Settings → Webhooks → Add webhook**
3. Enter:
   - Payload URL: `http://<JENKINS-PUBLIC-IP>:8080/github-webhook/`
   - Content type: `application/json`
   - Events: ✅ Just the push event
   - Active: ✅
4. Click **Add webhook**

### 3. Test Webhook
1. Make a commit to your repository
2. Push to GitHub
3. Jenkins should automatically trigger the pipeline

## Verify Setup

### Test Pipeline Manually
1. Go to your pipeline job
2. Click **Build Now**
3. Monitor **Console Output**

### Check Build Stages
The pipeline should execute in this order:
1. ✅ Code Fetch from GitHub
2. ✅ Build Docker Image
3. ✅ Push to DockerHub
4. ✅ Deploy to Kubernetes
5. ✅ Install Prometheus
6. ✅ Install Grafana

## Troubleshooting

### Jenkins Can't Access Docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### kubectl Not Found
```bash
sudo cp /usr/local/bin/kubectl /usr/bin/kubectl
```

### Permission Denied (kubeconfig)
```bash
sudo chown jenkins:jenkins ~/.kube/config
sudo chmod 600 ~/.kube/config
```

### Port Already in Use
```bash
# Check what's using port 8080
sudo netstat -tulpn | grep 8080

# Change Jenkins port (if needed)
sudo vim /etc/default/jenkins
# Change HTTP_PORT=8080 to HTTP_PORT=8081
sudo systemctl restart jenkins
```

## Security Best Practices

1. **Change admin password** after initial login
2. **Enable security** (Manage Jenkins → Configure Global Security)
3. **Use HTTPS** (configure reverse proxy with Nginx)
4. **Restrict access** using AWS Security Groups
5. **Regular backups** of Jenkins home directory

## AWS Security Group Rules

Add these inbound rules to your EC2 Security Group:
- Port 8080 (Jenkins Web UI) - Your IP
- Port 22 (SSH) - Your IP
- Port 30080 (Application NodePort) - Anywhere
- Port 30090 (Prometheus) - Your IP
- Port 30091 (Grafana) - Your IP

## Next Steps

1. ✅ Install all prerequisites
2. ✅ Configure Jenkins
3. ✅ Add credentials
4. ✅ Create pipeline job
5. ✅ Setup GitHub webhook
6. ✅ Test the pipeline
7. ✅ Access deployed application
8. ✅ Configure monitoring dashboards
