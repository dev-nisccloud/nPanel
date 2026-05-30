# Zeepo Builder - VPS Setup Guide

**Server:** Hivelocity VPS  
**OS:** Ubuntu 24.04 LTS (Noble Numbat)  
**Purpose:** Hosts the Builder Orchestrator service, Docker-based project dev servers, Nginx reverse proxy, and all project git repos for the Zeepo Builder product.

> Complete this guide top to bottom, in order. Do not skip steps. Every section builds on the previous one.

---

## Table of Contents

1. [Initial Access](#1-initial-access)
2. [System Update & Essential Packages](#2-system-update--essential-packages)
3. [Create Admin User & Disable Root](#3-create-admin-user--disable-root)
4. [SSH Hardening](#4-ssh-hardening)
5. [Firewall - UFW](#5-firewall--ufw)
6. [Fail2ban - Brute Force Protection](#6-fail2ban--brute-force-protection)
7. [Kernel & Network Hardening](#7-kernel--network-hardening)
8. [Swap Configuration](#8-swap-configuration)
9. [Automatic Security Updates](#9-automatic-security-updates)
10. [Docker Engine Installation](#10-docker-engine-installation)
11. [Docker Security Hardening](#11-docker-security-hardening)
12. [Docker Images - Build astro-dev and nextjs-dev](#12-docker-images--build-astro-dev-and-nextjs-dev)
13. [Directory Structure & Permissions](#13-directory-structure--permissions)
14. [Nginx Installation & Configuration](#14-nginx-installation--configuration)
15. [Wildcard SSL Certificate - Let's Encrypt](#15-wildcard-ssl-certificate--lets-encrypt)
16. [DNS Records](#16-dns-records)
17. [Bun Runtime Installation](#17-bun-runtime-installation)
18. [Git Configuration](#18-git-configuration)
19. [Builder Orchestrator - Service Setup](#19-builder-orchestrator--service-setup)
20. [Log Management](#20-log-management)
21. [Monitoring & Alerts](#21-monitoring--alerts)
22. [Backup Strategy](#22-backup-strategy)
23. [AppArmor](#23-apparmor)
24. [Final Verification Checklist](#24-final-verification-checklist)
25. [Ongoing Maintenance](#25-ongoing-maintenance)

---

## 1. Initial Access

Hivelocity emails you root credentials and the VPS IP when the server is provisioned.

```bash
# From your local machine
ssh root@YOUR_VPS_IP
```

If Hivelocity requires a password on first login, change it immediately:

```bash
passwd
# Enter a strong password (you will disable password auth entirely in Step 4)
```

Record your VPS IP address - you will use it throughout this guide:

```bash
ip addr show
# Look for the inet line under eth0 or ens3 - that is your public IP
```

---

## 2. System Update & Essential Packages

Always do this before anything else on a fresh server.

```bash
# Update package lists
apt update

# Upgrade all installed packages to latest versions
apt upgrade -y

# Remove packages that are no longer needed
apt autoremove -y

# Clean up downloaded package files
apt clean

# Install essential tools you will need throughout setup
apt install -y \
  curl \
  wget \
  git \
  vim \
  nano \
  htop \
  ncdu \
  net-tools \
  unzip \
  jq \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common \
  build-essential \
  tree \
  ufw \
  fail2ban \
  logrotate \
  cron \
  rsync \
  openssl

# Set the server timezone to UTC
# UTC is the standard for servers - avoids daylight saving confusion in logs
timedatectl set-timezone UTC

# Verify timezone
timedatectl status

# Set the hostname
hostnamectl set-hostname builder.nisccloud.app

# Verify
hostname
```

Reboot after the initial upgrade to apply any kernel updates:

```bash
reboot
```

Wait 30 seconds, then SSH back in as root:

```bash
ssh root@YOUR_VPS_IP
```

---

## 3. Create Admin User & Disable Root

Running everything as root is dangerous. Create a dedicated admin user.

```bash
# Create the user - replace 'nisc' with whatever username you want
adduser nisc
# You will be prompted for a password - use a strong one
# You will be asked for Full Name etc - press Enter to skip all of them

# Add to the sudo group so this user can run administrative commands
usermod -aG sudo nisc

# Copy root's SSH authorized_keys to the new user
# This means you can SSH in as 'nisc' with the same key you use for root
mkdir -p /home/nisc/.ssh
cp /root/.ssh/authorized_keys /home/nisc/.ssh/authorized_keys
chown -R nisc:nisc /home/nisc/.ssh
chmod 700 /home/nisc/.ssh
chmod 600 /home/nisc/.ssh/authorized_keys
```

Open a **second terminal window** and verify you can log in as `nisc` before proceeding:

```bash
# In the second terminal window - do NOT close the first one yet
ssh nisc@YOUR_VPS_IP

# Verify sudo works
sudo whoami
# Should print: root
```

If that works, you are ready to continue. All remaining steps use the `nisc` user (with `sudo` where needed).

---

## 4. SSH Hardening

Objectives:
- Disable root login over SSH entirely
- Disable password authentication (keys only)
- Move SSH off the default port 22 (reduces automated scan noise)
- Limit authentication attempts

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

sudo nano /etc/ssh/sshd_config
```

Find and set (or add) each of these lines. Some may already exist with different values - change them:

```
# Change the default port to reduce automated scanning
Port 2222

# Disable root login completely
PermitRootLogin no

# Disable password login - SSH keys only
PasswordAuthentication no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no

# Enable public key authentication
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Reduce the window for completing login
LoginGraceTime 30

# Limit failed auth attempts before disconnecting
MaxAuthTries 3

# Only allow specific users to SSH in
AllowUsers nisc

# Disable X11 forwarding (not needed on a server)
X11Forwarding no

# Disable TCP forwarding if you do not need it
AllowTcpForwarding no

# Log level - INFO is sufficient, use VERBOSE if debugging
LogLevel INFO

# Keep alive settings to prevent stale connections
ClientAliveInterval 300
ClientAliveCountMax 2
```

Save the file. Test the configuration before restarting:

```bash
sudo sshd -t
# No output = no errors. If there are errors, fix them before continuing.
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

**Critical:** Open a **third terminal window** and verify you can SSH in on the new port before closing any existing sessions:

```bash
# In the third terminal window
ssh -p 2222 nisc@YOUR_VPS_IP
```

If it works, you can safely close the other terminal windows. From this point, always use port 2222:

```bash
ssh -p 2222 nisc@YOUR_VPS_IP
```

Add this to your `~/.ssh/config` on your **local machine** so you do not have to type the port every time:

```
Host niscbuilder
    HostName YOUR_VPS_IP
    User nisc
    Port 2222
    IdentityFile ~/.ssh/id_rsa
```

Then you can just type: `ssh niscbuilder`

---

## 5. Firewall - UFW

UFW (Uncomplicated Firewall) is the standard Ubuntu firewall frontend. The rule is simple: deny everything by default, then explicitly allow only what is needed.

```bash
# Deny all incoming connections by default
sudo ufw default deny incoming

# Allow all outgoing connections (the server can reach the internet)
sudo ufw default allow outgoing

# Allow SSH on the new port
# IMPORTANT: Do this before enabling UFW or you will lock yourself out
sudo ufw allow 2222/tcp comment 'SSH'

# Allow HTTP (needed for Let's Encrypt certificate renewal)
sudo ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS (all web traffic)
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable the firewall
sudo ufw enable
# Type 'y' when prompted

# Verify the rules
sudo ufw status verbose
```

Expected output:

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), deny (routed)

To                         Action      From
--                         ------      ----
2222/tcp                   ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

**Important:** Container preview ports (4321 for Astro, 3000 for Next.js, etc.) are NOT opened here. Nginx proxies all traffic internally. Containers are never directly exposed to the internet.

The Builder Orchestrator listens on a port that is also NOT opened in UFW - it only accepts connections from the nPanel server (same internal network or via a private IP). If nPanel and the VPS are on different networks, add a specific rule:

```bash
# Only if nPanel server has a static IP - replace with actual IP
sudo ufw allow from NPANEL_SERVER_IP to any port 7331 comment 'Builder Orchestrator internal'
```

---

## 6. Fail2ban - Brute Force Protection

Fail2ban monitors log files and temporarily bans IP addresses that show signs of automated attack attempts.

```bash
sudo apt install fail2ban -y

# Create a local configuration file
# Always edit the .local file, not the .conf file
# .conf files are overwritten on updates; .local files are preserved
sudo nano /etc/fail2ban/jail.local
```

Paste this complete configuration:

```ini
[DEFAULT]
# Ban for 1 hour on first offense
bantime  = 1h

# Look back 10 minutes for repeated failures
findtime = 10m

# Allow 5 failures before banning
maxretry = 5

# Email alerts - optional, fill in if you have an SMTP server
# destemail = admin@nisccloud.app
# sendername = Fail2ban
# mta = sendmail
# action = %(action_mwl)s

# Ban action - uses ufw
banaction = ufw

[sshd]
enabled  = true
port     = 2222
logpath  = %(sshd_log)s
maxretry = 3
bantime  = 24h

[nginx-http-auth]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/error.log

[nginx-botsearch]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/access.log
maxretry = 2
bantime  = 24h
```

```bash
# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status

# Check SSH jail specifically
sudo fail2ban-client status sshd
```

---

## 7. Kernel & Network Hardening

These settings harden the Linux kernel against common network attacks. Apply them via `sysctl`.

```bash
sudo nano /etc/sysctl.d/99-builder-hardening.conf
```

Paste this complete file:

```ini
# ── IPv4 Hardening ──────────────────────────────────────────────────────────

# Ignore ICMP broadcast requests (Smurf attack protection)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignore bogus ICMP error responses
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Enable TCP SYN cookies (SYN flood protection)
net.ipv4.tcp_syncookies = 1

# Do not accept source routing (prevents IP spoofing)
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

# Do not accept ICMP redirects (prevents MITM attacks)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0

# Do not send ICMP redirects (this is not a router)
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Enable reverse path filtering (anti-spoofing)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Log martian packets (packets with impossible source addresses)
net.ipv4.conf.all.log_martians = 1

# Do not forward packets (this server is not a router)
net.ipv4.ip_forward = 0

# ── IPv6 Hardening ──────────────────────────────────────────────────────────

# Disable IPv6 entirely if you are not using it
# Comment these out if you need IPv6
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1

# ── Memory & Process Hardening ───────────────────────────────────────────────

# Restrict access to kernel pointer addresses in /proc
kernel.kptr_restrict = 2

# Restrict dmesg access to root only
kernel.dmesg_restrict = 1

# Disable core dumps for setuid programs
fs.suid_dumpable = 0

# Randomize memory layout (ASLR) - set to maximum
kernel.randomize_va_space = 2

# ── Docker-specific networking ───────────────────────────────────────────────
# Docker requires IP forwarding to route traffic to containers
# This overrides the ip_forward=0 above - Docker sets this automatically
# but we document it here for clarity
# net.ipv4.ip_forward = 1   ← Docker enables this itself
```

Apply immediately and persist across reboots:

```bash
sudo sysctl -p /etc/sysctl.d/99-builder-hardening.conf

# Note: Docker will re-enable ip_forward when it starts - that is expected and needed
```

---

## 8. Swap Configuration

Swap prevents the server from running out of memory and killing processes. A VPS doing AI builds can have memory spikes.

```bash
# Check if swap already exists
free -h
swapon --show

# If no swap exists, create a 4GB swap file
# For an 8GB RAM VPS, 4GB swap is a reasonable safety net
sudo fallocate -l 4G /swapfile

# Secure the swap file - only root can read it
sudo chmod 600 /swapfile

# Mark it as swap space
sudo mkswap /swapfile

# Enable the swap
sudo swapon /swapfile

# Make it permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Tune swap usage - prefer RAM, only use swap when RAM is at 90%
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.d/99-builder-hardening.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.d/99-builder-hardening.conf

sudo sysctl -p /etc/sysctl.d/99-builder-hardening.conf

# Verify
free -h
```

---

## 9. Automatic Security Updates

The server must patch itself for security vulnerabilities without you manually logging in every day.

```bash
sudo apt install unattended-upgrades -y

sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

Ensure these lines are uncommented and set:

```
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}";
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

// Automatically reboot at 3am if a kernel update requires it
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";

// Remove unused kernel packages
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
```

```bash
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

```
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
```

```bash
# Enable the service
sudo systemctl enable unattended-upgrades
sudo systemctl start unattended-upgrades

# Test the configuration (dry run)
sudo unattended-upgrade --dry-run --debug
```

---

## 10. Docker Engine Installation

Install the official Docker Engine from Docker's repository - not the Ubuntu snap or apt version, which are often outdated.

```bash
# Remove any old Docker versions that might exist
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Set up Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker's repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

# Add the nisc user to the docker group
# This allows running docker commands without sudo
sudo usermod -aG docker nisc

# Apply group change without logging out
newgrp docker

# Verify Docker is running
sudo systemctl status docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Test - should print "Hello from Docker!"
docker run --rm hello-world
```

---

## 11. Docker Security Hardening

This is the most critical section for customer data isolation. Every setting here directly protects one customer's project from being accessible by another.

```bash
sudo nano /etc/docker/daemon.json
```

Paste this complete configuration:

```json
{
  "userns-remap": "default",
  "no-new-privileges": true,
  "icc": false,
  "live-restore": true,
  "userland-proxy": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 1024,
      "Soft": 512
    },
    "nproc": {
      "Name": "nproc",
      "Hard": 512,
      "Soft": 256
    }
  },
  "storage-driver": "overlay2"
}
```

**What each setting does and why:**

| Setting | Protection |
|---|---|
| `userns-remap: default` | Maps container root (UID 0) to an unprivileged host user (e.g., UID 165536). If a container is fully compromised and an attacker escapes to the host, they have zero host privileges. This is the most important setting. |
| `no-new-privileges: true` | Prevents container processes from using `setuid` binaries to gain elevated capabilities. |
| `icc: false` | Inter-Container Communication disabled. Container A cannot send any network packet to Container B. Each customer's dev server is completely network-isolated from all others on the same host. |
| `live-restore: true` | Containers keep running if the Docker daemon restarts (e.g., during Docker updates). Prevents customer preview disruption during maintenance. |
| `userland-proxy: false` | Improves performance and reduces attack surface for exposed container ports. |
| `log-driver` limits | Prevents a single runaway container from filling the entire disk with log output, which would crash all other containers on the host. |
| `ulimits` | Limits file descriptors and process count per container. Prevents a fork bomb or file descriptor exhaustion inside one container from affecting the host or other containers. |

```bash
# Restart Docker to apply the daemon configuration
sudo systemctl restart docker

# Verify the daemon config was applied
docker info | grep -A5 "Security Options"
# You should see: userns, seccomp, apparmor in the output
```

**Additional security - seccomp profile:**

Docker applies a default seccomp profile that blocks ~300 dangerous system calls. Verify it is active:

```bash
docker info | grep seccomp
# Should show: seccomp  Profile: builtin
```

**Per-container flags used by the Orchestrator:**

Every container the Orchestrator creates must be launched with these flags. This is documented here so you understand what the Orchestrator code is doing and why:

```bash
docker run \
  --name "project-{projectId}" \
  --hostname "builder-sandbox" \
  --network none \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=256m \
  --tmpfs /run:rw,noexec,nosuid,size=64m \
  --memory 512m \
  --memory-swap 512m \
  --cpus 0.5 \
  --pids-limit 150 \
  --security-opt no-new-privileges:true \
  --security-opt seccomp=/etc/docker/seccomp-builder.json \
  --cap-drop ALL \
  --cap-add CHOWN \
  --cap-add SETUID \
  --cap-add SETGID \
  --cap-add DAC_OVERRIDE \
  --restart no \
  --mount type=bind,source=/projects/{projectId}/src,target=/app/src \
  --mount type=bind,source=/shared-modules/astro,target=/app/node_modules,readonly \
  nisc/astro-dev:latest
```

| Flag | Why |
|---|---|
| `--network none` | Container has zero network access. It serves on localhost only (Nginx connects via docker network bridge or host networking, not through the container's external network) |
| `--read-only` | The container's root filesystem is read-only. Malicious code cannot modify the OS or install tools |
| `--tmpfs /tmp` | Gives the container a writable temporary directory in RAM. `noexec` means scripts cannot be executed from /tmp |
| `--memory 512m` `--memory-swap 512m` | Hard RAM cap with no swap extension. One container cannot consume all VPS RAM |
| `--cpus 0.5` | Hard CPU cap. One build cannot peg all cores |
| `--pids-limit 150` | Prevents fork bombs |
| `--cap-drop ALL` + selective `--cap-add` | Removes all Linux kernel capabilities. Adds back only the minimum needed for `astro dev` to run |
| `--restart no` | Orchestrator manages container lifecycle, not Docker's restart policy |

---

## 12. Docker Images - Build astro-dev and nextjs-dev

These images are built once and reused for every customer project. `node_modules` is pre-installed so there is no `npm install` wait per project.

### Create the build directory

```bash
mkdir -p ~/docker-images/astro-dev
mkdir -p ~/docker-images/nextjs-dev
```

### Astro Dev Image

```bash
nano ~/docker-images/astro-dev/Dockerfile
```

```dockerfile
FROM node:20-alpine

# Create a non-root user inside the container
RUN addgroup -g 1001 builder && \
    adduser -u 1001 -G builder -s /bin/sh -D builder

# Set working directory
WORKDIR /app

# Copy a minimal Astro project scaffold with package.json
COPY package.json astro.config.mjs tsconfig.json ./

# Install all dependencies as root, then hand over to builder user
RUN npm install --prefer-offline --no-audit --no-fund && \
    chown -R builder:builder /app/node_modules

# Create src directory - will be bind-mounted from host per project
RUN mkdir -p /app/src && chown builder:builder /app/src

# Switch to non-root user
USER builder

# Expose the Astro dev server port
EXPOSE 4321

# Start Astro dev server - bind to all interfaces so Nginx can reach it
CMD ["npx", "astro", "dev", "--host", "0.0.0.0", "--port", "4321"]
```

```bash
nano ~/docker-images/astro-dev/package.json
```

```json
{
  "name": "nisc-astro-builder",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/image": "^0.18.0",
    "tailwindcss": "^3.4.0"
  }
}
```

```bash
nano ~/docker-images/astro-dev/astro.config.mjs
```

```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [tailwind(), sitemap()],
  server: { host: '0.0.0.0', port: 4321 },
  srcDir: './src',
  outDir: './dist',
});
```

```bash
nano ~/docker-images/astro-dev/tsconfig.json
```

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Build the image:

```bash
cd ~/docker-images/astro-dev
docker build -t nisc/astro-dev:latest .

# Verify it built correctly
docker images | grep astro-dev
```

### Next.js Dev Image

```bash
nano ~/docker-images/nextjs-dev/Dockerfile
```

```dockerfile
FROM node:20-alpine

RUN addgroup -g 1001 builder && \
    adduser -u 1001 -G builder -s /bin/sh -D builder

WORKDIR /app

COPY package.json next.config.ts tsconfig.json ./

RUN npm install --prefer-offline --no-audit --no-fund && \
    chown -R builder:builder /app/node_modules

RUN mkdir -p /app/src /app/app /app/public && \
    chown -R builder:builder /app

USER builder

EXPOSE 3000

CMD ["npx", "next", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
```

```bash
nano ~/docker-images/nextjs-dev/package.json
```

```json
{
  "name": "nisc-nextjs-builder",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.0.0",
    "autoprefixer": "^10.0.0"
  }
}
```

```bash
nano ~/docker-images/nextjs-dev/next.config.ts
```

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

```bash
nano ~/docker-images/nextjs-dev/tsconfig.json
```

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```bash
cd ~/docker-images/nextjs-dev
docker build -t nisc/nextjs-dev:latest .

docker images | grep nextjs-dev
```

---

## 13. Directory Structure & Permissions

```bash
# All project source files and git repos live here
sudo mkdir -p /projects

# Shared read-only node_modules - containers mount these instead of installing per project
sudo mkdir -p /shared-modules/astro
sudo mkdir -p /shared-modules/nextjs

# Logs for the orchestrator service
sudo mkdir -p /var/log/builder-orchestrator

# Builder orchestrator application directory
sudo mkdir -p /opt/builder-orchestrator

# Give the nisc user ownership of everything the orchestrator needs
sudo chown -R nisc:nisc /projects
sudo chown -R nisc:nisc /shared-modules
sudo chown -R nisc:nisc /var/log/builder-orchestrator
sudo chown -R nisc:nisc /opt/builder-orchestrator

# Strict permissions on /projects - only the nisc user (orchestrator) can read/write
# No other system user can browse or access project files
sudo chmod 700 /projects
sudo chmod 755 /shared-modules

# Populate shared node_modules from the Docker image
# Extract the pre-installed node_modules from the Docker image into the shared directory
# This lets containers mount the modules without running npm install
docker run --rm \
  --entrypoint="" \
  nisc/astro-dev:latest \
  tar -cf - /app/node_modules | tar -xf - -C /shared-modules/astro --strip-components=2

docker run --rm \
  --entrypoint="" \
  nisc/nextjs-dev:latest \
  tar -cf - /app/node_modules | tar -xf - -C /shared-modules/nextjs --strip-components=2

# Verify
ls /shared-modules/astro | head -10
ls /shared-modules/nextjs | head -10
```

Each project gets its own subdirectory created by the Orchestrator at project creation time:

```
/projects/
  {projectId-1}/
    .git/
    src/
      pages/
        index.astro
      layouts/
        BaseLayout.astro
      components/
    astro.config.mjs
    package.json
  {projectId-2}/
    .git/
    src/
    ...
```

---

## 14. Nginx Installation & Configuration

Nginx acts as the reverse proxy between the internet and the Docker containers. It handles SSL termination, subdomain routing, and security headers.

```bash
sudo apt install nginx -y
sudo systemctl enable nginx

# Remove the default site
sudo rm /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-available/default
```

### Main nginx.conf optimizations

```bash
sudo nano /etc/nginx/nginx.conf
```

Replace the entire `http {}` block with:

```nginx
http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;  # hide Nginx version in headers

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Logging
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=preview:10m rate=60r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_conn_zone $binary_remote_addr zone=addr:10m;

    # Buffer sizes to protect against certain DoS attacks
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### HTTP to HTTPS redirect

```bash
sudo nano /etc/nginx/sites-available/redirect-http
```

```nginx
# Redirect all HTTP to HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/redirect-http /etc/nginx/sites-enabled/redirect-http
```

### Builder preview subdomain config

The Orchestrator dynamically writes upstream blocks to a file that Nginx includes. This avoids full Nginx config rewrites every time a container starts.

```bash
# Create the directory for dynamic upstream configs
sudo mkdir -p /etc/nginx/builder-upstreams
sudo chown nisc:nisc /etc/nginx/builder-upstreams
```

```bash
sudo nano /etc/nginx/sites-available/builder-preview
```

```nginx
# Include all dynamic upstream definitions written by the Orchestrator
include /etc/nginx/builder-upstreams/*.conf;

# Wildcard preview subdomain handler
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ~^preview-(?<projectid>[a-z0-9\-]+)\.preview\.nisccloud\.app$;

    ssl_certificate /etc/letsencrypt/live/preview.nisccloud.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/preview.nisccloud.app/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/preview.nisccloud.app/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Rate limiting - 60 requests per minute per IP
    limit_req zone=preview burst=20 nodelay;
    limit_conn addr 10;

    location / {
        # Pass to the upstream named after the project ID
        # The upstream block is written by the Orchestrator
        proxy_pass http://builder_$projectid;
        proxy_http_version 1.1;

        # WebSocket support - needed for HMR (hot module replacement)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # If the container is not running yet, return a friendly error
        proxy_intercept_errors on;
        error_page 502 503 =200 @container_not_ready;
    }

    location @container_not_ready {
        default_type application/json;
        return 503 '{"error":"workspace_starting","message":"Your workspace is starting up. This usually takes 5-10 seconds."}';
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/builder-preview /etc/nginx/sites-enabled/builder-preview

# Test config - fix any errors before proceeding
sudo nginx -t
```

---

## 15. Wildcard SSL Certificate - Let's Encrypt

Wildcard certificates (`*.preview.nisccloud.app`) require DNS-based validation, not HTTP validation. This section uses the Cloudflare DNS plugin. If your DNS is with a different provider, install the matching certbot plugin instead.

```bash
# Install Certbot and the Cloudflare plugin
sudo apt install certbot python3-certbot-dns-cloudflare -y
```

Create a Cloudflare API credentials file:

```bash
sudo mkdir -p /etc/letsencrypt/
sudo nano /etc/letsencrypt/cloudflare.ini
```

```ini
# Cloudflare API token - create one at dash.cloudflare.com
# Required permissions: Zone:DNS:Edit for your domain
dns_cloudflare_api_token = YOUR_CLOUDFLARE_API_TOKEN_HERE
```

```bash
# Lock down the credentials file - only root can read it
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
```

Issue the wildcard certificate:

```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 \
  -d "preview.nisccloud.app" \
  -d "*.preview.nisccloud.app" \
  --email admin@nisccloud.app \
  --agree-tos \
  --non-interactive
```

Verify the certificate was issued:

```bash
sudo certbot certificates
# Should show: preview.nisccloud.app with * in domains and an expiry date
```

Set up automatic renewal:

```bash
# Certbot installs a systemd timer automatically. Verify it:
sudo systemctl status certbot.timer

# Test renewal (dry run - does not actually renew)
sudo certbot renew --dry-run
```

Add a renewal hook to reload Nginx after each renewal:

```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

```bash
#!/bin/bash
systemctl reload nginx
```

```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Now restart Nginx with SSL:

```bash
sudo systemctl start nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 16. DNS Records

Add these records in your DNS provider (Cloudflare, Route53, etc.):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `preview.nisccloud.app` | `YOUR_VPS_IP` | 300 |
| A | `*.preview.nisccloud.app` | `YOUR_VPS_IP` | 300 |

The wildcard `A` record means `preview-abc123.preview.nisccloud.app`, `preview-xyz789.preview.nisccloud.app`, and any other subdomain all route to your VPS. Nginx then routes each to the correct container based on the subdomain.

If using Cloudflare:
- Set the proxy status to **DNS only** (grey cloud, not orange) for the wildcard record. Wildcard records with Cloudflare proxy do not work on free/pro plans.
- The `A` record for `preview.nisccloud.app` itself can be proxied or DNS-only.

Wait for DNS propagation (usually under 5 minutes with Cloudflare):

```bash
dig +short preview.nisccloud.app
# Should return YOUR_VPS_IP

dig +short preview-test.preview.nisccloud.app
# Should also return YOUR_VPS_IP
```

---

## 17. Bun Runtime Installation

The Builder Orchestrator is a Hono + Bun service. Install Bun for the `nisc` user:

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH permanently
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
bun --version
```

---

## 18. Git Configuration

The Orchestrator creates one git repo per project and commits every change automatically. Configure git globally for the `nisc` user:

```bash
git config --global user.name "Zeepo Builder"
git config --global user.email "builder@nisccloud.app"
git config --global init.defaultBranch main
git config --global core.autocrlf false

# Performance: cache git credentials if needed (not usually necessary for local repos)
git config --global credential.helper cache

# Verify
git config --global --list
```

---

## 19. Builder Orchestrator - Service Setup

The Orchestrator is a Hono + Bun HTTP service that nPanel calls internally to manage Docker containers, sync files, run git commands, and trigger builds. It listens on a localhost port that is never exposed to the internet.

### Deploy the Orchestrator

The actual Orchestrator code lives in `apps/builder-orchestrator/` in the nPanel repository. To deploy it to the VPS:

```bash
# On the VPS - create the app directory
mkdir -p /opt/builder-orchestrator

# Method 1: Pull from your git repository (recommended)
# Set up SSH key for the VPS to access your private git repo
ssh-keygen -t ed25519 -C "builder-vps-deploy" -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub
# Copy this public key and add it as a Deploy Key in your GitHub/GitLab repo settings

# Add to SSH config
nano ~/.ssh/config
```

```
Host github.com
    IdentityFile ~/.ssh/deploy_key
    StrictHostKeyChecking accept-new
```

```bash
# Clone or pull the orchestrator code
cd /opt/builder-orchestrator
git clone git@github.com:YOUR_ORG/nPanel.git /tmp/npanel-deploy
cp -r /tmp/npanel-deploy/apps/builder-orchestrator/* /opt/builder-orchestrator/
rm -rf /tmp/npanel-deploy

# Install dependencies
cd /opt/builder-orchestrator
bun install
```

### Environment configuration

```bash
nano /opt/builder-orchestrator/.env
```

```env
# Port the orchestrator listens on (never exposed via UFW)
PORT=7331

# Secret token - nPanel server must send this in every request
# Generate with: openssl rand -hex 32
ORCHESTRATOR_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_HERE

# Docker settings
DOCKER_SOCKET=/var/run/docker.sock
ASTRO_IMAGE=nisc/astro-dev:latest
NEXTJS_IMAGE=nisc/nextjs-dev:latest

# Project storage
PROJECTS_DIR=/projects
SHARED_MODULES_ASTRO=/shared-modules/astro
SHARED_MODULES_NEXTJS=/shared-modules/nextjs

# Nginx
NGINX_UPSTREAMS_DIR=/etc/nginx/builder-upstreams
NGINX_RELOAD_CMD=sudo nginx -s reload

# Preview URL template
PREVIEW_URL_TEMPLATE=https://preview-{projectId}.preview.nisccloud.app

# Container resource limits
CONTAINER_MEMORY_LIMIT=512m
CONTAINER_CPU_LIMIT=0.5
CONTAINER_PIDS_LIMIT=150

# Auto-stop idle containers after this many minutes
CONTAINER_IDLE_TIMEOUT_MINUTES=20

# Node port range for containers (Nginx maps subdomain → port)
# Each container gets a unique port in this range
PORT_RANGE_START=10000
PORT_RANGE_END=10999
```

```bash
# Secure the env file
chmod 600 /opt/builder-orchestrator/.env
```

### Allow Orchestrator to reload Nginx without a password

The Orchestrator needs to run `nginx -s reload` after writing new upstream configs. Add a specific passwordless sudo rule:

```bash
sudo nano /etc/sudoers.d/builder-orchestrator
```

```
nisc ALL=(root) NOPASSWD: /usr/sbin/nginx -s reload
```

```bash
sudo chmod 440 /etc/sudoers.d/builder-orchestrator

# Verify syntax
sudo visudo -c -f /etc/sudoers.d/builder-orchestrator
```

### systemd service

```bash
sudo nano /etc/systemd/system/builder-orchestrator.service
```

```ini
[Unit]
Description=Zeepo Builder Orchestrator
Documentation=https://github.com/YOUR_ORG/nPanel
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=nisc
Group=nisc
WorkingDirectory=/opt/builder-orchestrator
ExecStart=/home/nisc/.bun/bin/bun run src/index.ts
EnvironmentFile=/opt/builder-orchestrator/.env

# Restart on failure, but not on clean exit
Restart=on-failure
RestartSec=5s
StartLimitBurst=5
StartLimitInterval=60s

# Security hardening for the service itself
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/projects /etc/nginx/builder-upstreams /var/log/builder-orchestrator
PrivateTmp=yes

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=builder-orchestrator

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable builder-orchestrator
sudo systemctl start builder-orchestrator

# Verify it started
sudo systemctl status builder-orchestrator

# Watch live logs
sudo journalctl -u builder-orchestrator -f
```

### Idle container cleanup - cron job

```bash
crontab -e
```

Add:

```bash
# Every 5 minutes - stop containers that have been idle for 20+ minutes
*/5 * * * * curl -s -X POST http://localhost:7331/admin/cleanup-idle \
  -H "Authorization: Bearer YOUR_ORCHESTRATOR_SECRET" \
  >> /var/log/builder-orchestrator/cleanup.log 2>&1
```

---

## 20. Log Management

Prevent logs from filling the disk. The VPS has finite storage and logs will grow indefinitely without rotation.

```bash
sudo nano /etc/logrotate.d/builder
```

```
# Orchestrator logs
/var/log/builder-orchestrator/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 640 nisc nisc
}

# Nginx logs
/var/log/nginx/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
```

```bash
# Test logrotate config
sudo logrotate --debug /etc/logrotate.d/builder
```

Docker container logs are already capped at 10MB per container (set in daemon.json in Step 11). Prune old Docker data weekly:

```bash
crontab -e
```

Add:

```bash
# Every Sunday at 2am - remove stopped containers, dangling images, unused volumes
0 2 * * 0 docker system prune -f >> /var/log/builder-orchestrator/docker-prune.log 2>&1
```

---

## 21. Monitoring & Alerts

### Disk usage alert

```bash
sudo nano /usr/local/bin/disk-alert.sh
```

```bash
#!/bin/bash
THRESHOLD=80
USAGE=$(df -h / | awk 'NR==2 {gsub(/%/, "", $5); print $5}')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  logger -t disk-alert "WARNING: Disk usage is at ${USAGE}% on $(hostname)"
  # Optional: send a webhook alert to Slack or Discord
  # curl -s -X POST YOUR_SLACK_WEBHOOK \
  #   -H 'Content-type: application/json' \
  #   --data "{\"text\":\"DISK WARNING: $(hostname) disk is at ${USAGE}%\"}"
fi
```

```bash
sudo chmod +x /usr/local/bin/disk-alert.sh
```

```bash
crontab -e
```

```bash
# Check disk every hour
0 * * * * /usr/local/bin/disk-alert.sh

# Check /projects directory size daily
0 6 * * * du -sh /projects/* | sort -h | tail -20 | logger -t project-sizes
```

### Docker container health check

```bash
sudo nano /usr/local/bin/container-health.sh
```

```bash
#!/bin/bash
# Log count of running, stopped, and total containers
RUNNING=$(docker ps -q | wc -l)
STOPPED=$(docker ps -aq --filter status=exited | wc -l)
TOTAL=$(docker ps -aq | wc -l)
logger -t container-health "Running: $RUNNING | Stopped: $STOPPED | Total: $TOTAL"
```

```bash
sudo chmod +x /usr/local/bin/container-health.sh
```

```bash
crontab -e
```

```bash
# Log container health every 15 minutes
*/15 * * * * /usr/local/bin/container-health.sh
```

Read logs with: `sudo journalctl -t container-health`

### Install htop and ncdu for manual inspection

```bash
sudo apt install htop ncdu -y

# View real-time resource usage
htop

# Find what is using disk space
sudo ncdu /projects
```

---

## 22. Backup Strategy

Project files are git repos - git itself is a backup mechanism. But you also want off-VPS backups for disaster recovery.

### Backup script

```bash
sudo nano /usr/local/bin/backup-projects.sh
```

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/projects_${TIMESTAMP}.tar.gz"

# Create backup directory if it does not exist
mkdir -p "$BACKUP_DIR"

# Create compressed archive of all project repos
tar -czf "$BACKUP_FILE" /projects/

# Keep only the last 7 daily backups
find "$BACKUP_DIR" -name "projects_*.tar.gz" -mtime +7 -delete

# Log completion
logger -t backup "Projects backup completed: $BACKUP_FILE ($(du -sh $BACKUP_FILE | cut -f1))"

# Optional: upload to remote storage (S3, Backblaze B2, etc.)
# aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/builder/
# rclone copy "$BACKUP_FILE" b2:your-bucket/builder/
```

```bash
sudo chmod +x /usr/local/bin/backup-projects.sh
```

```bash
crontab -e
```

```bash
# Daily backup at 1am
0 1 * * * /usr/local/bin/backup-projects.sh
```

---

## 23. AppArmor

AppArmor is a Linux security module that restricts what programs can do. It is enabled by default on Ubuntu. Verify it is running:

```bash
sudo apparmor_status
# Should show a list of profiles in enforce mode
# Docker uses AppArmor automatically for containers
```

The default Docker AppArmor profile (`docker-default`) is applied to all containers unless overridden. This profile blocks:
- Raw network sockets
- Writing to sensitive `/proc` and `/sys` paths
- Loading kernel modules
- Mounting filesystems

Verify the profile is active:

```bash
docker info | grep apparmor
# Should show: Security Options: apparmor
```

---

## 24. Final Verification Checklist

Work through each item and confirm it passes before declaring the VPS ready.

```bash
# 1. SSH on new port
ssh -p 2222 nisc@YOUR_VPS_IP

# 2. Root login rejected
ssh -p 2222 root@YOUR_VPS_IP
# Should get: Permission denied (publickey)

# 3. Firewall rules correct
sudo ufw status verbose
# Should show only ports 2222, 80, 443

# 4. Fail2ban running
sudo fail2ban-client status sshd

# 5. Docker running and daemon config applied
sudo systemctl status docker
docker info | grep -E "userns|icc|no-new-priv"

# 6. Docker images present
docker images | grep nisc

# 7. Test container isolation - start two containers and verify they cannot ping each other
docker run -d --name test1 --network none nisc/astro-dev:latest sleep 300
docker run -d --name test2 --network none nisc/astro-dev:latest sleep 300
docker exec test1 ping -c1 172.17.0.1 2>&1 | grep -q "Network unreachable" && echo "PASS: network isolation" || echo "FAIL"
docker stop test1 test2 && docker rm test1 test2

# 8. Nginx config valid
sudo nginx -t

# 9. SSL certificate valid
sudo certbot certificates
openssl s_client -connect preview.nisccloud.app:443 -servername preview.nisccloud.app 2>/dev/null | openssl x509 -noout -dates

# 10. DNS resolves correctly
dig +short preview.nisccloud.app
dig +short preview-test123.preview.nisccloud.app
# Both should return YOUR_VPS_IP

# 11. Orchestrator service running
sudo systemctl status builder-orchestrator
curl -s http://localhost:7331/health
# Should return: {"status":"ok"}

# 12. Auto-updates enabled
systemctl is-enabled unattended-upgrades

# 13. Swap active
free -h | grep Swap
# Should show non-zero Swap total

# 14. Disk space reasonable
df -h /
# Ensure at least 50% free before going live

# 15. Logrotate config valid
sudo logrotate --debug /etc/logrotate.d/builder

# 16. Git configured
git config --global --list
```

---

## 25. Ongoing Maintenance

### Updating the Docker images

When Astro or Next.js releases a major update:

```bash
# Rebuild the image
cd ~/docker-images/astro-dev
nano package.json  # update version numbers
docker build -t nisc/astro-dev:latest .

# Repopulate shared node_modules
docker run --rm --entrypoint="" nisc/astro-dev:latest \
  tar -cf - /app/node_modules | tar -xf - -C /shared-modules/astro --strip-components=2

echo "Image updated. Existing running containers use the old image until they are restarted."
echo "New containers will use the new image immediately."
```

### Deploying Orchestrator updates

```bash
cd /opt/builder-orchestrator
git pull origin main
bun install
sudo systemctl restart builder-orchestrator
sudo systemctl status builder-orchestrator
```

### Manual container inspection

```bash
# List all running containers
docker ps

# Check logs for a specific project container
docker logs project-{projectId} --tail 50

# Get a shell inside a running container (for debugging only)
docker exec -it project-{projectId} sh

# Stop a specific container manually
docker stop project-{projectId}

# See resource usage per container
docker stats --no-stream
```

### Cleaning up orphaned project data

```bash
# If a project is deleted from nPanel but the directory remains
sudo ls /projects/
# Compare with active project IDs in the nPanel database
# Remove orphaned directories:
sudo rm -rf /projects/{orphaned-project-id}
```

### Scaling beyond one VPS

When the single VPS approaches capacity (monitor `docker stats` - when average CPU > 70% or RAM > 80%):

1. Provision a second VPS and repeat this entire guide on it
2. Add a `VPS_HOST` field to the `zeepo_builder_project` DB table that records which VPS hosts each project's container
3. The Orchestrator on VPS 1 handles projects assigned to VPS 1; VPS 2's Orchestrator handles its own
4. nPanel routes Orchestrator calls to the correct VPS based on `VPS_HOST`
5. A load balancer (Nginx on a third server, or a Hivelocity load balancer) distributes new project assignments across VPS instances based on current load

---

## Quick Reference - Important Paths

| Path | Purpose |
|---|---|
| `/projects/` | All project git repos and source files |
| `/projects/{projectId}/.git/` | Git history for a specific project |
| `/projects/{projectId}/src/` | Bind-mounted into the Docker container |
| `/shared-modules/astro/` | Pre-installed Astro node_modules (read-only mount) |
| `/shared-modules/nextjs/` | Pre-installed Next.js node_modules (read-only mount) |
| `/opt/builder-orchestrator/` | Orchestrator application |
| `/opt/builder-orchestrator/.env` | Orchestrator secrets and config |
| `/etc/nginx/sites-available/builder-preview` | Nginx preview routing config |
| `/etc/nginx/builder-upstreams/` | Dynamic upstream files written by Orchestrator |
| `/etc/letsencrypt/live/preview.nisccloud.app/` | SSL certificate files |
| `/var/log/builder-orchestrator/` | Orchestrator logs |
| `/var/log/nginx/` | Nginx access and error logs |
| `/backups/` | Compressed project backups |
| `/etc/docker/daemon.json` | Docker daemon security config |
| `~/docker-images/` | Dockerfiles for the dev images |

## Quick Reference - Important Commands

```bash
# SSH into VPS
ssh -p 2222 nisc@YOUR_VPS_IP

# Orchestrator service
sudo systemctl status builder-orchestrator
sudo systemctl restart builder-orchestrator
sudo journalctl -u builder-orchestrator -f

# Nginx
sudo nginx -t && sudo systemctl reload nginx
sudo journalctl -u nginx -f

# Docker
docker ps                            # running containers
docker stats --no-stream             # resource usage
docker system prune -f               # clean up stopped containers

# Firewall
sudo ufw status verbose

# SSL cert
sudo certbot certificates
sudo certbot renew --dry-run

# Disk
df -h
sudo ncdu /projects
```
