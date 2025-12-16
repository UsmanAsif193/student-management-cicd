# Docker Image Naming Convention

## Image Structure
```
dockerhub-username/student-management-system:tag
```

## Example
```
yourusername/student-management-system:latest
yourusername/student-management-system:v1.0.0
yourusername/student-management-system:dev
```

## Tags Used in CI/CD
- `latest` - Most recent build
- `${BUILD_NUMBER}` - Jenkins build number
- `${GIT_COMMIT}` - Git commit hash (first 7 characters)

## Important Notes
1. Replace `usmanasif193` with your actual DockerHub username
2. Create repository on DockerHub before pushing
3. Add DockerHub credentials to Jenkins (ID: `dockerhub-credentials`)
