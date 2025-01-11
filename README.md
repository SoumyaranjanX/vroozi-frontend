# Contract Processing System Frontend

Enterprise-grade contract processing and purchase order generation system built with Angular 15+ and TypeScript 4.9+.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [Docker Support](#docker-support)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Overview

The Contract Processing System frontend is an enterprise-scale Angular application designed for automated contract processing and purchase order generation. Key features include:

- Real-time contract processing with OCR integration
- Secure document management and version control
- Dynamic purchase order generation
- Role-based access control
- Enterprise security compliance
- Performance-optimized architecture

### Technology Stack
- Angular 15+
- TypeScript 4.9+
- NgRx for state management
- Angular Material UI components
- RxJS 7.8+
- Jest for unit testing
- Cypress for E2E testing

## Prerequisites

Ensure your development environment meets the following requirements:

### Required Software
- Node.js >= 16.14.0
- NPM >= 8.0.0
- Angular CLI ^15.0.0
- Docker >= 24.0.0
- Docker Compose >= 2.20.0
- Git >= 2.40.0
- Visual Studio Code (recommended)

### VSCode Extensions
- Angular Language Service
- ESLint
- Prettier
- Docker
- GitLens
- EditorConfig for VS Code

### Enterprise Requirements
- Valid enterprise VPN access
- Security certificates for development
- Access to enterprise npm registry
- Required security clearances

## Getting Started

### Repository Setup
```bash
# Clone the repository
git clone [repository-url]
cd src/web

# Install dependencies
npm install

# Copy environment template
cp .env.template .env

# Configure environment variables
vi .env
```

### Environment Configuration
1. Configure the `.env` file with required variables:
```plaintext
API_BASE_URL=http://localhost:8000
AUTH_SERVICE_URL=http://localhost:8001
GOOGLE_VISION_API_KEY=[your-key]
ENVIRONMENT=development
LOG_LEVEL=debug
```

2. Install security certificates:
```bash
# Create certificates directory
mkdir -p ./certificates

# Copy enterprise certificates
cp /path/to/enterprise/certs/* ./certificates/
```

### Initial Build
```bash
# Verify setup with development build
npm run build:dev

# Start development server
npm run start
```

## Development

### Available Scripts
```bash
# Development server
npm run start

# Production build
npm run build:prod

# Unit tests
npm run test

# E2E tests
npm run e2e

# Lint check
npm run lint

# Format code
npm run format
```

### Development Server
The development server includes:
- Hot reload support
- Source map generation
- Error overlay
- API proxy configuration

```bash
npm run start
```
Access the application at `http://localhost:4200`

### Code Standards
- Follow Angular style guide
- Maintain 100% unit test coverage
- Use strict TypeScript configuration
- Implement proper error handling
- Follow security best practices

### State Management
- Use NgRx for global state
- Implement feature-based store modules
- Follow action/reducer patterns
- Maintain proper state selectors
- Document state changes

## Docker Support

### Development Environment
```bash
# Build development image
docker-compose -f docker-compose.dev.yml build

# Start development container
docker-compose -f docker-compose.dev.yml up
```

### Production Build
```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Start production container
docker-compose -f docker-compose.prod.yml up
```

### Multi-stage Build Process
The production Dockerfile implements:
- Build stage optimization
- Production-ready Nginx configuration
- Security hardening
- Environment variable handling
- Health check implementation

## Deployment

### CI/CD Pipeline
The application uses Jenkins for CI/CD with:
- Automated testing
- SonarQube code analysis
- Security scanning
- ArgoCD deployment
- Automated rollbacks

### Build Process
```bash
# Production build
npm run build:prod

# Run security scan
npm run security-scan

# Generate documentation
npm run compodoc
```

### Deployment Verification
1. Security compliance check
2. Performance benchmark
3. Accessibility validation
4. Cross-browser testing
5. Load testing verification

## Project Structure
```plaintext
src/
├── app/
│   ├── core/           # Singleton services, guards
│   ├── features/       # Feature modules
│   ├── shared/         # Shared components, pipes
│   └── store/          # NgRx store configuration
├── assets/
│   ├── icons/
│   ├── images/
│   └── styles/
├── environments/       # Environment configurations
└── tests/             # Test configurations
```

### Module Architecture
- Core module for singleton services
- Feature modules for business logic
- Shared module for common components
- Lazy-loaded feature modules
- Proper module dependencies

## Troubleshooting

### Common Issues
1. **Build Failures**
   - Verify Node.js version
   - Clear npm cache
   - Check enterprise registry access

2. **Development Server Issues**
   - Verify port availability
   - Check proxy configuration
   - Validate SSL certificates

3. **Docker Problems**
   - Verify Docker daemon status
   - Check container logs
   - Validate network configuration

4. **Performance Issues**
   - Enable production mode
   - Verify lazy loading
   - Check bundle size
   - Monitor memory usage

### Support Channels
- Enterprise IT Support Portal
- Development Team Slack Channel
- Technical Documentation Wiki
- Security Team Contact

## License
Proprietary - All Rights Reserved

## Security
Report security vulnerabilities to security@enterprise.com