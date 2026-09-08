# Multi-stage production Dockerfile for Donna OS
# Includes Node.js 20 runtime and Python 3 for the Autonomous Kernel Engine

FROM node:20-bookworm-slim AS base

# Install Python 3, venv, and build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Set up the Donna virtual environment (donnas-world)
RUN python3 -m venv donnas-world && \
    donnas-world/bin/pip install --no-cache-dir requests beautifulsoup4 python-dotenv

# Copy source code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/models/status || exit 1

# Start Donna OS Kernel (Next.js server + detached worker daemon)
CMD ["python3", "run.py"]
