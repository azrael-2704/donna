# Donna OS - Production Deployment Guide

Donna OS is a dual-runtime agentic platform combining a **Next.js (React 19) App Router** frontend/API with an **isolated Python Kernel** and **detached Worker Daemon**.

---

## 1. Quick Deploy with Docker Compose (Recommended)

To run Donna OS on any Linux server, VPS (Hetzner, DigitalOcean, AWS EC2), or local Docker engine:

```bash
# 1. Clone the repository
git clone https://github.com/azrael-2704/donna.git
cd donna

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your Gemini API Key and Firebase credentials

# 3. Launch with Docker Compose
docker compose up -d --build
```

Access Donna OS at `http://localhost:3000` (or `http://YOUR_SERVER_IP:3000`).

---

## 2. Deploying on Cloud Platforms (Railway / Render / Fly.io)

### Option A: Railway
1. Fork or push your private repo to GitHub.
2. In [Railway.app](https://railway.app), click **New Project** -> **Deploy from GitHub repo**.
3. Railway will detect the `Dockerfile` automatically.
4. Add your `.env` variables under **Variables** (`GEMINI_API_KEY`, Firebase keys).
5. Expose Port `3000`.

### Option B: Render / Fly.io
- Use the included `Dockerfile`.
- Set the HTTP service port to `3000`.
- Mount a persistent volume at `/app/.donna` if you wish to retain scheduled background jobs across container restarts.

---

## 3. Direct Bare-Metal / Systemd Service

If running directly on a server:

```bash
# Setup Python virtualenv
python3 -m venv donnas-world
source donnas-world/bin/activate
pip install requests beautifulsoup4 python-dotenv

# Install Node dependencies and build
npm ci
npm run build

# Start via the Donna Orchestrator
python3 run.py
```

### Systemd Service Configuration (`/etc/systemd/system/donna.service`):

```ini
[Unit]
Description=Donna OS Autonomous Agent Platform
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/donna
EnvironmentFile=/home/ubuntu/donna/.env
ExecStart=/usr/bin/python3 /home/ubuntu/donna/run.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now donna
```
