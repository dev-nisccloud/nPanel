# nisccloudstorage, start to finish

This is the only document you need on the server. Every command is here. Every script and every config file is here, in full. You paste them into the server with `cat`. You do not clone a git repository, and you do not log in to GitHub.

You are building a private Docker stack on the same machine that already hosts websites and mail. The stack does not use the hosting panel. It has its own web server, its own Let's Encrypt certificate, and its own disk.

When you are finished:

| What | Where |
| --- | --- |
| S3 API | `https://cloudstorage.nisccloud.com` |
| Bucket | `nisccloudstorage` |
| Admin console | `http://127.0.0.1:9001` on the server only |
| Object files | `/mnt/storage/minio` on the reserved disk |
| Certificates | `/mnt/storage/letsencrypt` on the reserved disk |
| Install directory | `/opt/nisccloudstorage` |

Four containers:

| Container | Job |
| --- | --- |
| `nisccloudstorage-minio` | Stores objects. Capped at 1 CPU and 1 GB of RAM. |
| `nisccloudstorage-minio-init` | Creates the bucket `nisccloudstorage`, then exits. Exit code 0 is success. |
| `nisccloudstorage-nginx` | Publishes the S3 API on the storage IP, ports 80 and 443. |
| `nisccloudstorage-certbot` | Renews the Let's Encrypt certificate every 12 hours. |

MinIO's own port 9000 is not published to the network. Nginx inside the Docker network talks to it. Port 9001, the console, listens only on `127.0.0.1`.

If your public name is not `cloudstorage.nisccloud.com`, you will replace that string in three nginx files and in `.env` before the first start. The name must be identical in all four places.

---

## 1. What has to be true before you start

You need:

- An SSH login that can become root on the hosting server.
- A disk that is not the disk holding `/`, `/boot`, `/var`, `/usr`, or `/home`. The identify script in section 4 classifies disks. You do not guess.
- A public IPv4 address for this stack that is not the address already used for customer websites and mail. Let's Encrypt and the S3 API both use ports 80 and 443. One address cannot have two programs on port 80. The hosting web server already listens on `0.0.0.0:80`, which means every address, unless you give this stack a different address and bind only that address.
- Permission to create a DNS A record for `cloudstorage.nisccloud.com` pointing at that storage address.
- Outbound HTTPS from the server to Docker Hub (`registry-1.docker.io`) and to Let's Encrypt.

You do not need a GitHub account. The container images are `minio/minio`, `minio/mc`, `nginx:1.27-alpine`, and `certbot/certbot`, all pulled from Docker Hub.

Keep this document open on your PC. The SSH session is only for pasting commands.

---

## 2. Become root

```sh
whoami
```

The reply must be `root`. If it is any other name:

```sh
sudo -i
whoami
```

Stay as root for the rest of this document. File ownership, `fstab`, Docker, and cron all require it.

Confirm you are on the machine you think you are. Write down the hostname. Section 4 prints it again, with a machine id, so you can compare.

```sh
hostname
```

---

## 3. Create the working directory

Everything this stack owns on the system disk is this directory. Object data does not go here. Object data goes on the reserved disk, mounted later at `/mnt/storage`.

```sh
mkdir -p /opt/nisccloudstorage/scripts /opt/nisccloudstorage/nginx/conf.d
cd /opt/nisccloudstorage
pwd
```

`pwd` must print `/opt/nisccloudstorage`.

---

## 4. Identify the computer, the addresses, and the disks

This script only prints. It does not mount, partition, or format anything.

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > scripts/identify.sh << 'ENDFILE'
#!/bin/sh
# Print which computer this is, which addresses it has, who owns
# ports 80 and 443, and which disks are safe to give to MinIO.
# This script does not mount, partition, or format anything.

set -eu

section() {
  printf '\n===== %s =====\n' "$1"
}

is_system_mount() {
  case "$1" in
    /|/boot|/boot/efi|/usr|/home|"[SWAP]") return 0 ;;
    /var|/var/*|/usr/*|/boot/*) return 0 ;;
  esac
  return 1
}

section "computer"
echo "hostname:    $(hostname 2>/dev/null || echo unknown)"
echo "fqdn:        $(hostname -f 2>/dev/null || echo none)"
echo "machine-id:  $(cat /etc/machine-id 2>/dev/null || echo unknown)"
if [ -f /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "os:          ${PRETTY_NAME:-unknown}"
fi
echo "kernel:      $(uname -srm)"
if command -v systemd-detect-virt >/dev/null 2>&1; then
  echo "virt:        $(systemd-detect-virt 2>/dev/null || echo unknown)"
fi
model=$(awk -F: '/model name/ { gsub(/^ +/, "", $2); print $2; exit }' /proc/cpuinfo 2>/dev/null || true)
echo "cpu:         ${model:-unknown} x $(nproc 2>/dev/null || echo '?')"
if command -v free >/dev/null 2>&1; then
  free -h | awk 'NR==1 || /^Mem:/ { print }'
fi
echo "root disk:   $(df -h / | awk 'NR==2 { print $1 "  size=" $2 "  used=" $3 "  avail=" $4 "  mount=" $6 }')"
echo "uptime:      $(uptime -p 2>/dev/null || uptime)"

section "addresses"
ip -4 -br address 2>/dev/null || ip -4 addr
pub=$(curl -4 -fsS --max-time 8 https://ifconfig.me 2>/dev/null || true)
echo "public-ipv4: ${pub:-could-not-reach-ifconfig.me}"

section "ports 80 and 443"
if command -v ss >/dev/null 2>&1; then
  ss -lntup | awk 'NR==1 || $5 ~ /:80$/ || $5 ~ /:443$/ || $5 ~ /:80\]/ || $5 ~ /:443\]/'
else
  netstat -lntup 2>/dev/null | awk 'NR<=2 || /:80 / || /:443 /' || true
fi
echo
echo "Read the process name on the right. sw-cp-server, nginx, httpd, and"
echo "apache2 on 0.0.0.0:80 or *:80 belong to the hosting stack."
echo "MinIO's own nginx must bind a different IP (STORAGE_BIND_IP)."
echo "Let's Encrypt HTTP challenge uses port 80 on that storage IP."

section "disks"
lsblk -o NAME,SIZE,TYPE,FSTYPE,LABEL,MOUNTPOINT,MODEL,SERIAL,ROTA
echo
echo "----- classification -----"
echo "SYSTEM     operating system or hosting files. Never format this."
echo "STORAGE    already mounted at /mnt/storage."
echo "CANDIDATE  no mounts. This is the only class prepare-disk.sh may use."
echo "IN_USE     mounted somewhere else. Do not take it."
echo

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

lsblk -dn -o NAME,TYPE | while read -r name dtype; do
  [ "$dtype" = "disk" ] || continue
  dev="/dev/$name"
  class="CANDIDATE"
  mounts=""
  for m in $(lsblk -nr -o MOUNTPOINT "$dev" 2>/dev/null); do
    [ -n "$m" ] || continue
    mounts="${mounts}${m},"
    if [ "$m" = "/mnt/storage" ]; then
      [ "$class" = "SYSTEM" ] || class="STORAGE"
      continue
    fi
    if is_system_mount "$m"; then
      class="SYSTEM"
      continue
    fi
    [ "$class" = "SYSTEM" ] || [ "$class" = "STORAGE" ] || class="IN_USE"
  done
  size=$(lsblk -nd -o SIZE "$dev")
  model=$(lsblk -nd -o MODEL "$dev" | sed 's/  */ /g; s/^ *//; s/ *$//')
  printf '%-10s %-14s %6s  mounts=%s  model=%s\n' \
    "$class" "$dev" "$size" "${mounts:-none}" "${model:-unknown}"
  printf '%s %s\n' "$class" "$dev" >> "$tmp"
done

echo
candidates=$(grep -c '^CANDIDATE ' "$tmp" || true)
storage=$(grep -c '^STORAGE ' "$tmp" || true)

section "decision"
if [ "$storage" -gt 0 ]; then
  echo "A disk is already mounted at /mnt/storage. Use that disk."
  echo "Do not format it. Run prepare-disk.sh only if the subdirectories"
  echo "/mnt/storage/minio, letsencrypt, and certbot are missing."
elif [ "$candidates" -eq 1 ]; then
  one=$(awk '$1 == "CANDIDATE" { print $2 }' "$tmp")
  echo "One empty disk: $one"
  echo "Next command: sh /opt/nisccloudstorage/scripts/prepare-disk.sh"
  echo "When it asks, type: $one"
elif [ "$candidates" -eq 0 ]; then
  echo "No empty disk. Stop. Do not format a SYSTEM or IN_USE disk."
else
  echo "More than one empty disk. Pick the reserved storage disk by size"
  echo "and serial from the table above, then pass that device to prepare-disk.sh."
  awk '$1 == "CANDIDATE" { print "  " $2 }' "$tmp"
fi
echo
echo "STORAGE_BIND_IP must be an address from the addresses section that"
echo "does not already have port 80 taken. Point cloudstorage.nisccloud.com"
echo "at that same address."
ENDFILE
```

```sh
chmod 755 /opt/nisccloudstorage/scripts/identify.sh
sh /opt/nisccloudstorage/scripts/identify.sh
```

Read the whole report. Do not skip to the disk commands.

### 4.1 Computer

Check `hostname`, `machine-id`, and `os`. If this is not the hosting server, disconnect. `root disk` is the operating-system filesystem. That disk is never the storage disk. `virt` tells you whether this is a virtual machine (`kvm`, `vmware`, and so on) or physical hardware (`none`).

### 4.2 Addresses

`ip -4` lists every IPv4 address already configured on this machine. `public-ipv4` is the address the internet sees when the server itself makes an outbound connection. That public address is often the hosting address, the one customer sites already use.

`STORAGE_BIND_IP` must be an address that appears in the `ip -4` list. It must not be the address customer websites already use.

If the only address in the list is the hosting address, stop. Order a second IPv4 address from the server provider and add it to this machine the same way extra addresses are already added here. Run the identify script again. The new address has to appear in `ip -4 addr` before Docker can bind it. This document does not invent a network-interface name and add an address for you, because adding the wrong address can take the hosting sites offline.

### 4.3 Ports 80 and 443

The process name on the right of each line matters.

- `sw-cp-server`, `nginx`, `httpd`, or `apache2` listening on `0.0.0.0:80` or `*:80` is the hosting web server. It already owns port 80 on every address.
- This stack will bind only `STORAGE_BIND_IP:80` and `STORAGE_BIND_IP:443`. It will not bind `0.0.0.0`. Binding `0.0.0.0` would fight the hosting web server for every site on the machine.

Linux can accept a listener on one specific address even when another program listens on all addresses. After the containers start, section 12 proves that a request to the storage address reaches MinIO and not the hosting panel. If that proof fails, you stop and fix the address before you ask Let's Encrypt for a certificate.

### 4.4 Disk classification

The script prints one line per whole disk:

| Class | Meaning |
| --- | --- |
| `SYSTEM` | Holds the operating system or hosting files (`/`, `/boot`, `/var`, `/usr`, `/home`, swap). Never format it. |
| `STORAGE` | Already mounted at `/mnt/storage`. Use it. Do not format it. |
| `CANDIDATE` | No mounts. This is the only class you may hand to the next script. |
| `IN_USE` | Mounted somewhere else. Leave it alone. |

Then read the decision at the bottom:

- One `CANDIDATE`: that device path is the reserved disk. Write it down. Example: `/dev/sdb` or `/dev/nvme1n1`. You will type the whole disk, not a partition such as `/dev/sdb1`.
- Zero candidates and no `STORAGE` line: stop. There is no empty disk.
- More than one `CANDIDATE`: choose by size and serial. The reserved disk is the one you added for object storage. If you are not sure which one that is, stop and check the provider's disk list before you continue.
- A `STORAGE` line: `/mnt/storage` is already mounted. Do not format that disk. You still run the next script so it can create `minio`, `letsencrypt`, and `certbot` on that mount if they are missing.

---

## 5. Mount the reserved disk

This script asks you to type the device path twice. It refuses a `SYSTEM` disk and a disk mounted anywhere other than `/mnt/storage`. It formats a disk only when the disk has no filesystem and you type the word `FORMAT` in capitals.

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > scripts/prepare-disk.sh << 'ENDFILE'
#!/bin/sh
# Mount the reserved disk at /mnt/storage and create MinIO and certificate
# directories on it. Refuses the operating-system disk. Formats only when
# the disk has no filesystem and you type FORMAT.

set -eu

MOUNT=/mnt/storage

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root."
  exit 1
fi

is_system_mount() {
  case "$1" in
    /|/boot|/boot/efi|/usr|/home|"[SWAP]") return 0 ;;
    /var|/var/*|/usr/*|/boot/*) return 0 ;;
  esac
  return 1
}

is_system_disk() {
  for m in $(lsblk -nr -o MOUNTPOINT "$1" 2>/dev/null); do
    if is_system_mount "$m"; then
      return 0
    fi
  done
  return 1
}

echo "Disks on $(hostname):"
lsblk -d -o NAME,SIZE,TYPE,MODEL,SERIAL
echo
printf "Reserved disk device (example /dev/sdb): "
read -r DISK

case "$DISK" in
  /dev/*) ;;
  *)
    echo "Aborted. The value must look like /dev/sdb or /dev/nvme1n1."
    exit 1
    ;;
esac

if [ ! -b "$DISK" ]; then
  echo "Aborted. $DISK is not a block device."
  exit 1
fi

kind=$(lsblk -ndo TYPE "$DISK")
if [ "$kind" != "disk" ]; then
  echo "Aborted. $DISK is a $kind. Pass the whole disk, not a partition."
  exit 1
fi

if is_system_disk "$DISK"; then
  echo "REFUSED. $DISK holds the operating system or hosting files."
  exit 1
fi

for m in $(lsblk -nr -o MOUNTPOINT "$DISK" 2>/dev/null); do
  case "$m" in
    ""|/mnt/storage) ;;
    *)
      echo "REFUSED. $DISK is mounted at $m."
      exit 1
      ;;
  esac
done

echo
lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT "$DISK"
echo
echo "Type the same device path again to confirm you mean $DISK"
printf "> "
read -r again
if [ "$again" != "$DISK" ]; then
  echo "Aborted. The confirmation did not match."
  exit 1
fi

base=$(basename "$DISK")
case "$base" in
  nvme*n[0-9]|mmcblk[0-9]*) PART="${DISK}p1" ;;
  *) PART="${DISK}1" ;;
esac

fstype=$(lsblk -nr -o FSTYPE "$DISK" | sed '/^$/d' | head -n 1 || true)

if [ -z "$fstype" ]; then
  if ! command -v parted >/dev/null 2>&1 || ! command -v mkfs.ext4 >/dev/null 2>&1; then
    echo "parted and mkfs.ext4 are required."
    echo "Debian/Ubuntu: apt-get install -y parted e2fsprogs"
    echo "Alma/RHEL:     dnf install -y parted e2fsprogs"
    exit 1
  fi
  echo "No filesystem on $DISK. This erases it."
  echo "Type FORMAT in capitals to continue."
  printf "> "
  read -r go
  if [ "$go" != "FORMAT" ]; then
    echo "Aborted."
    exit 1
  fi
  parted -s "$DISK" mklabel gpt
  parted -s "$DISK" mkpart primary ext4 0% 100%
  i=0
  while [ ! -b "$PART" ] && [ "$i" -lt 15 ]; do
    sleep 1
    i=$((i + 1))
  done
  if [ ! -b "$PART" ]; then
    echo "Partition $PART did not appear. Check lsblk and stop."
    exit 1
  fi
  mkfs.ext4 -L nisccloudstorage "$PART"
  fstype=ext4
else
  disk_fs=$(lsblk -ndo FSTYPE "$DISK" || true)
  if [ -n "$disk_fs" ]; then
    PART=$DISK
    fstype=$disk_fs
  else
    child=$(lsblk -nr -o NAME,FSTYPE "$DISK" | awk 'NR>1 && $2 != "" { print $1; exit }')
    if [ -z "$child" ]; then
      echo "Could not find the filesystem on $DISK."
      exit 1
    fi
    PART="/dev/$child"
    fstype=$(lsblk -ndo FSTYPE "$PART")
  fi
  echo "Keeping existing $fstype filesystem on $PART. Nothing will be formatted."
fi

mkdir -p "$MOUNT"
if ! findmnt -n "$MOUNT" >/dev/null 2>&1; then
  mount "$PART" "$MOUNT"
fi

uuid=$(blkid -o value -s UUID "$PART")
if [ -z "$uuid" ]; then
  echo "Could not read the UUID of $PART."
  exit 1
fi

if grep -q "$uuid" /etc/fstab; then
  echo "fstab already has UUID=$uuid"
else
  cp -a /etc/fstab "/etc/fstab.bak.$(date +%Y%m%d%H%M%S)"
  printf '%s\n' "UUID=$uuid $MOUNT $fstype defaults,noatime,nofail 0 2" >> /etc/fstab
  echo "Added fstab line. nofail keeps the hosting server bootable if this disk is missing."
fi

if findmnt -n "$MOUNT" >/dev/null 2>&1; then
  umount "$MOUNT"
fi
mount -a
findmnt "$MOUNT"

mkdir -p "$MOUNT/minio" "$MOUNT/letsencrypt" "$MOUNT/certbot"
chown 1000:1000 "$MOUNT/minio"
chmod 750 "$MOUNT/minio"
chmod 755 "$MOUNT/letsencrypt" "$MOUNT/certbot"

echo
echo "Ready."
echo "  disk:        $PART"
echo "  mount:       $MOUNT"
echo "  minio data:  $MOUNT/minio"
echo "  certificates:$MOUNT/letsencrypt"
df -h "$MOUNT"
ENDFILE
```

```sh
chmod 755 /opt/nisccloudstorage/scripts/prepare-disk.sh
sh /opt/nisccloudstorage/scripts/prepare-disk.sh
```

What you will be asked, in order:

1. `Reserved disk device`. Type the `CANDIDATE` path from section 4, for example `/dev/sdb`. Not `/dev/sdb1`. The script exits if you pass a partition.
2. The same path again. If the two entries differ, it aborts and changes nothing.
3. `FORMAT`, only if the disk has no filesystem. That erases the disk, writes a GPT partition table, creates one partition, and formats it `ext4` with the label `nisccloudstorage`. The label is 16 characters, which is the maximum `ext4` allows. If you do not want to erase the disk, press Enter or type anything else. The script aborts.
4. If the disk already has `ext4` or `xfs`, it tells you it is keeping that filesystem. It does not format it.

If the script says `parted` or `mkfs.ext4` is missing, install them and run the script again.

Debian or Ubuntu:

```sh
apt-get update
apt-get install -y parted e2fsprogs
```

AlmaLinux, CloudLinux, Rocky, CentOS, or RHEL:

```sh
dnf install -y parted e2fsprogs
```

On success the script:

- Mounts the partition at `/mnt/storage`.
- Copies `/etc/fstab` to `/etc/fstab.bak.<timestamp>` and appends one line. `nofail` means a missing storage disk does not stop the hosting server from booting.
- Unmounts and mounts again from `fstab`, so you know the boot line works before you reboot.
- Creates `/mnt/storage/minio`, `/mnt/storage/letsencrypt`, and `/mnt/storage/certbot`.
- Gives `/mnt/storage/minio` to user id 1000, which is the user inside the MinIO image. If this ownership is wrong, MinIO exits with permission denied.

Confirm all of the following before you install Docker. `df` must show the large disk on `/mnt/storage`, not the small system disk.

```sh
findmnt /mnt/storage
df -h / /mnt/storage /mnt/storage/minio
ls -ld /mnt/storage/minio /mnt/storage/letsencrypt /mnt/storage/certbot
grep nisccloudstorage /etc/fstab || grep /mnt/storage /etc/fstab
```

`ls -ld` on `/mnt/storage/minio` must show owner `1000`. Do not reboot until `findmnt /mnt/storage` prints a line. If it does not, fix `fstab` before you continue. The backup file is the copy made a moment ago.

---

## 6. Install Docker

Check what is already installed:

```sh
docker --version
docker compose version
```

If both commands print a version, go to section 7. The compose command is `docker compose` with a space. That is the v2 plugin. The older `docker-compose` program, with a hyphen, is not what these steps use.

If either command is missing, install curl and then Docker's own install script. That script installs Docker Engine and the compose plugin from Docker's package repository. It does not use GitHub.

Debian or Ubuntu:

```sh
apt-get update
apt-get install -y ca-certificates curl
```

AlmaLinux, CloudLinux, Rocky, CentOS, or RHEL:

```sh
dnf install -y ca-certificates curl
```

Then, on any of those systems:

```sh
curl -fsSL https://get.docker.com -o /root/get-docker.sh
sh /root/get-docker.sh
systemctl enable --now docker
docker --version
docker compose version
```

`systemctl enable --now` starts Docker now and starts it again after a reboot. Both version commands must print a version before you continue. If `curl` to `get.docker.com` fails, the server cannot reach Docker's site. Fix outbound HTTPS before you continue. Do not download a MinIO binary from GitHub instead.

---

## 7. Write the compose file

`cd /opt/nisccloudstorage` if you are not already there.

This file defines the four containers. Nginx publishes `STORAGE_BIND_IP:80` and `STORAGE_BIND_IP:443` only. MinIO data is `/mnt/storage/minio`. Certificates are `/mnt/storage/letsencrypt`. The double dollar signs in the file are intentional. Docker Compose turns `$$` into a single `$` inside the container.

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > docker-compose.yml << 'ENDFILE'
# Standalone MinIO stack. Its own nginx and its own Let's Encrypt.
# Object data and certificates live on the reserved disk mounted at /mnt/storage.
# MinIO's S3 port is not published. Nginx on STORAGE_BIND_IP is the public door.
# The console is only on 127.0.0.1:9001.
#
# Do not put nginx/storage-https.conf into nginx/conf.d until init-ssl.sh has
# written the certificate. nginx refuses to start when those pem files are missing.

services:

  minio:
    image: minio/minio:latest
    container_name: nisccloudstorage-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_SITE_NAME: ${MINIO_SITE_NAME:-nisccloudstorage}
      MINIO_SERVER_URL: https://${DOMAIN_STORAGE}
      MINIO_PROMETHEUS_AUTH_TYPE: "public"
    volumes:
      - ${MINIO_DATA_DIR:-/mnt/storage/minio}:/data:Z
    ports:
      - "127.0.0.1:9001:9001"
    cpus: ${MINIO_CPU_LIMIT:-1.0}
    mem_limit: ${MINIO_MEMORY_LIMIT:-1g}
    pids_limit: 512
    logging:
      driver: json-file
      options:
        max-size: "20m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  minio-init:
    image: minio/mc:latest
    container_name: nisccloudstorage-minio-init
    depends_on:
      minio:
        condition: service_healthy
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_DEFAULT_BUCKET: ${MINIO_DEFAULT_BUCKET:-nisccloudstorage}
    entrypoint: >
      /bin/sh -c "
        mc alias set local http://minio:9000 $$MINIO_ROOT_USER $$MINIO_ROOT_PASSWORD;
        mc mb --ignore-existing local/$$MINIO_DEFAULT_BUCKET;
        mc anonymous set download local/$$MINIO_DEFAULT_BUCKET;
        echo 'Bucket $$MINIO_DEFAULT_BUCKET ready';
      "
    restart: "no"

  nginx:
    image: nginx:1.27-alpine
    container_name: nisccloudstorage-nginx
    restart: unless-stopped
    ports:
      - "${STORAGE_BIND_IP}:80:80"
      - "${STORAGE_BIND_IP}:443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ${CERTBOT_WEBROOT:-/mnt/storage/certbot}:/var/www/certbot:z
      - ${LETSENCRYPT_DIR:-/mnt/storage/letsencrypt}:/etc/letsencrypt:z
    depends_on:
      - minio
    cpus: "0.50"
    mem_limit: 256m
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 60s
      timeout: 10s
      retries: 3

  certbot:
    image: certbot/certbot:latest
    container_name: nisccloudstorage-certbot
    restart: unless-stopped
    volumes:
      - ${CERTBOT_WEBROOT:-/mnt/storage/certbot}:/var/www/certbot:z
      - ${LETSENCRYPT_DIR:-/mnt/storage/letsencrypt}:/etc/letsencrypt:z
    entrypoint: >
      /bin/sh -c "
        trap exit TERM;
        while :; do
          certbot renew --webroot -w /var/www/certbot --quiet;
          sleep 12h & wait $${!};
        done
      "
ENDFILE
```

---

## 8. Write the nginx files

Nginx reads only the files in `nginx/conf.d`. For the first start, that directory contains one file, the HTTP site. The HTTPS file stays outside `conf.d` until a certificate exists. If the HTTPS file is in `conf.d` too early, nginx refuses to start because the certificate files are missing.

### 8.1 Main nginx config

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > nginx/nginx.conf << 'ENDFILE'
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log  /var/log/nginx/access.log  main;

    sendfile           on;
    tcp_nopush         on;
    tcp_nodelay        on;
    keepalive_timeout  65;

    client_max_body_size 1G;

    proxy_buffering         off;
    proxy_request_buffering off;

    gzip on;
    gzip_types text/plain application/json application/xml;

    include /etc/nginx/conf.d/*.conf;
}
ENDFILE
```

### 8.2 HTTP site, used until the certificate exists

This accepts the Let's Encrypt challenge on `/.well-known/acme-challenge/` and proxies every other request to MinIO. Uploads up to 1 GB are allowed. The body is not buffered, which is what multipart S3 uploads need.

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > nginx/conf.d/storage-http.conf << 'ENDFILE'
# HTTP bootstrap. Used before a certificate exists.
# Serves the Let's Encrypt challenge and proxies the S3 API.
# init-ssl.sh replaces this file with the redirect config after the certificate is issued.

server {
    listen 80;
    server_name cloudstorage.nisccloud.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    client_max_body_size 1G;
    proxy_ignore_client_abort on;

    location / {
        proxy_pass http://minio:9000;

        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header   Connection "";

        proxy_connect_timeout 300s;
        proxy_send_timeout    300s;
        proxy_read_timeout    300s;

        proxy_buffering         off;
        proxy_request_buffering off;
    }
}
ENDFILE
```

### 8.3 HTTP site after the certificate exists

Leave this file outside `conf.d`. The certificate script copies it over `nginx/conf.d/storage-http.conf` after Let's Encrypt succeeds. Port 80 then stays open only for renewals and redirects everything else to HTTPS.

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > nginx/storage-http-redirect.conf << 'ENDFILE'
# Replaces conf.d/storage-http.conf after Let's Encrypt has issued the certificate.
# Port 80 stays up for renewals, and every other request goes to HTTPS.

server {
    listen 80;
    server_name cloudstorage.nisccloud.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
ENDFILE
```

### 8.4 HTTPS site

Leave this file outside `conf.d` as well. The certificate script copies it to `nginx/conf.d/storage-https.conf` only after `fullchain.pem` and `privkey.pem` exist.

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > nginx/storage-https.conf << 'ENDFILE'
# Copied into conf.d/ only after the certificate exists.
# nginx will not start if this file is in conf.d and the pem files are missing.

server {
    listen 443 ssl;
    http2  on;
    server_name cloudstorage.nisccloud.com;

    ssl_certificate     /etc/letsencrypt/live/cloudstorage.nisccloud.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloudstorage.nisccloud.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    client_max_body_size 1G;
    proxy_ignore_client_abort on;

    location / {
        proxy_pass http://minio:9000;

        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header   Connection "";

        proxy_connect_timeout 300s;
        proxy_send_timeout    300s;
        proxy_read_timeout    300s;

        proxy_buffering         off;
        proxy_request_buffering off;
    }
}
ENDFILE
```

### 8.5 A different public name

Skip this if the name is `cloudstorage.nisccloud.com`.

If the public name is something else, replace it in all three site files before you start. Use the real name with no `https://` and no trailing slash:

```sh
cd /opt/nisccloudstorage
sed -i 's/cloudstorage.nisccloud.com/THE-REAL-NAME/g' \
  nginx/conf.d/storage-http.conf \
  nginx/storage-http-redirect.conf \
  nginx/storage-https.conf
grep -n THE-REAL-NAME nginx/conf.d/storage-http.conf nginx/storage-http-redirect.conf nginx/storage-https.conf
```

You will put that same name in `DOMAIN_STORAGE` in the next section. The certificate directory Let's Encrypt creates is named after `DOMAIN_STORAGE`. If the nginx files and `DOMAIN_STORAGE` disagree, nginx will look for the certificate in the wrong folder.

Confirm the HTTPS file is not loaded yet:

```sh
ls -l /opt/nisccloudstorage/nginx/conf.d
ls -l /opt/nisccloudstorage/nginx/storage-https.conf /opt/nisccloudstorage/nginx/storage-http-redirect.conf
```

`conf.d` must contain only `storage-http.conf`.

---

## 9. Write the environment file

Generate the MinIO root password and store it in your password manager. This command prints it once.

```sh
openssl rand -hex 32
```

Create the env file:

```sh
nano /opt/nisccloudstorage/.env
```

Paste the block below. Then change three values. Do not add quotes. Do not put spaces around `=`.

- `STORAGE_BIND_IP` is the dedicated address from section 4. Not `0.0.0.0`. Not the hosting sites address.
- `MINIO_ROOT_PASSWORD` is the `openssl` line.
- `CERTBOT_EMAIL` is a mailbox you actually read. Let's Encrypt sends expiry notices there.
- `DOMAIN_STORAGE` stays `cloudstorage.nisccloud.com` unless you changed the nginx files in section 8.5. No `https://`.

```text
STORAGE_BIND_IP=change_me_storage_ip
DOMAIN_STORAGE=cloudstorage.nisccloud.com
CERTBOT_EMAIL=admin@nisccloud.com
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=paste-the-openssl-line-here
MINIO_SITE_NAME=nisccloudstorage
MINIO_DEFAULT_BUCKET=nisccloudstorage
MINIO_DATA_DIR=/mnt/storage/minio
LETSENCRYPT_DIR=/mnt/storage/letsencrypt
CERTBOT_WEBROOT=/mnt/storage/certbot
MINIO_CPU_LIMIT=1.0
MINIO_MEMORY_LIMIT=1g
```

Save with Ctrl+O, Enter, then Ctrl+X.

```sh
chmod 600 /opt/nisccloudstorage/.env
```

What each value does:

| Variable | Effect |
| --- | --- |
| `STORAGE_BIND_IP` | The only address nginx publishes on ports 80 and 443. |
| `DOMAIN_STORAGE` | Public DNS name. MinIO builds presigned upload and download URLs as `https://` plus this name. |
| `CERTBOT_EMAIL` | Contact on the Let's Encrypt account. |
| `MINIO_ROOT_USER` | Admin user for the S3 API and the console. |
| `MINIO_ROOT_PASSWORD` | Admin password. The app uses this as `S3_SECRET_KEY`. |
| `MINIO_SITE_NAME` | Name MinIO shows for this one server. |
| `MINIO_DEFAULT_BUCKET` | Bucket created on first start. Must be `nisccloudstorage`. |
| `MINIO_DATA_DIR` | Host folder mounted as MinIO's data disk. Must be on `/mnt/storage`. |
| `LETSENCRYPT_DIR` | Where the certificate is stored, on the reserved disk. |
| `CERTBOT_WEBROOT` | Where the HTTP challenge file is written. |
| `MINIO_CPU_LIMIT` | Hard CPU cap for the MinIO container. `1.0` is one core. |
| `MINIO_MEMORY_LIMIT` | Hard RAM cap for the MinIO container. `1g` is 1 gibibyte. |

The caps exist so a busy upload cannot take the CPU and RAM the websites and mail need. When MinIO hits the cap, storage gets slower. The hosting processes keep their memory.

Check the three values that people mistype:

```sh
grep -E '^(STORAGE_BIND_IP|DOMAIN_STORAGE|MINIO_DEFAULT_BUCKET|MINIO_ROOT_PASSWORD)=' /opt/nisccloudstorage/.env
```

Stop if any of these are true:

- `STORAGE_BIND_IP` is still `change_me_storage_ip`, is empty, or is `0.0.0.0`.
- `MINIO_ROOT_PASSWORD` is still `change_me_strong_password` or is empty.
- `MINIO_DEFAULT_BUCKET` is not exactly `nisccloudstorage`.
- `DOMAIN_STORAGE` does not match the name inside the three nginx files.

---

## 10. Checks before the first start

Run these yourself. All of them must pass.

```sh
cd /opt/nisccloudstorage
findmnt /mnt/storage
test -d /mnt/storage/minio && test -d /mnt/storage/letsencrypt && test -d /mnt/storage/certbot && echo directories-ok
test ! -f nginx/conf.d/storage-https.conf && echo https-config-not-loaded-yet
docker compose version
```

`findmnt` prints the reserved disk. `directories-ok` and `https-config-not-loaded-yet` must both print. `docker compose version` must print a version.

---

## 11. Start MinIO and the HTTP site

```sh
cd /opt/nisccloudstorage
docker compose pull
docker compose up -d minio minio-init nginx
```

`pull` downloads four images the first time: `minio/minio`, `minio/mc`, `nginx:1.27-alpine`, and `certbot/certbot`. Certbot is downloaded now and started later, after the certificate exists.

Watch the result:

```sh
docker compose ps
```

Wait until you see this shape. It can take about a minute.

| Name | Status you want |
| --- | --- |
| `nisccloudstorage-minio` | Up, healthy |
| `nisccloudstorage-minio-init` | Exited (0) |
| `nisccloudstorage-nginx` | Up |
| `nisccloudstorage-certbot` | Not created yet |

`Exited (0)` on the init container is success. It created the bucket and stopped. It is not a crash.

Port 9000 is not published, so you do not curl `127.0.0.1:9000` from the host. You go through nginx, on the storage address. Replace `STORAGE_BIND_IP` in the command with the real address:

```sh
curl -fsS http://STORAGE_BIND_IP/minio/health/live && echo OK
docker logs nisccloudstorage-minio-init --tail 30
docker stats --no-stream nisccloudstorage-minio nisccloudstorage-nginx
df -h / /mnt/storage
```

You want:

- The curl command prints `OK`. The body of `/minio/health/live` is empty. `OK` is only the echo after a successful curl.
- The init log contains the line `Bucket nisccloudstorage ready`.
- `docker stats` shows a memory limit of `1GiB` for MinIO and `256MiB` for nginx.
- `df` shows `/` almost unchanged and `/mnt/storage` as the place MinIO is writing.

If curl prints an HTML page from the hosting panel, port 80 on that address is still the hosting web server. Do not request a certificate. Stop nginx so it is not half-bound, and go back to section 4:

```sh
cd /opt/nisccloudstorage
docker compose stop nginx
docker compose rm -f nginx
```

After the storage address is really free for this stack:

```sh
cd /opt/nisccloudstorage
docker compose up -d nginx
curl -fsS http://STORAGE_BIND_IP/minio/health/live && echo OK
```

`docker compose up` saying `address already in use` means something is already bound to that exact address and port. Do not change `STORAGE_BIND_IP` to `0.0.0.0` to get past the error.

---

## 12. Point DNS at the storage address

On the server:

```sh
getent hosts cloudstorage.nisccloud.com
```

If `getent` prints nothing, `dig` may still be available:

```sh
dig +short cloudstorage.nisccloud.com
```

The address printed must be `STORAGE_BIND_IP`. If it is the hosting sites address, or it is empty, create or change the A record at the DNS host that serves the domain. Wait, then run `getent` again.

Let's Encrypt checks this name from the public internet. A record that is correct only in your laptop's `hosts` file is not enough. Do not run the certificate step until `getent` on the server shows the storage address.

Also confirm the firewall in front of the server allows TCP 80 and 443 to the storage address. On the server itself:

```sh
command -v firewall-cmd >/dev/null && firewall-cmd --list-services
```

If that prints a list, `http` and `https` need to be in it. They usually already are, because the hosting sites use them. If they are missing:

```sh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

A cloud provider security group is separate from `firewall-cmd`. Port 80 and 443 must be allowed there too, toward this server.

---

## 13. Issue the certificate

This script reads `/opt/nisccloudstorage/.env`, refuses a placeholder bind address, asks you to type `y`, and then:

1. Runs certbot once in a temporary container. The challenge file is written to `/mnt/storage/certbot`, which nginx serves at `/.well-known/acme-challenge/`.
2. Checks that both `fullchain.pem` and `privkey.pem` exist under `/mnt/storage/letsencrypt/live/<DOMAIN_STORAGE>`.
3. Replaces the HTTP site with the redirect site.
4. Copies the HTTPS site into `nginx/conf.d`.
5. Tests the nginx config and reloads nginx.
6. Starts `nisccloudstorage-certbot`, which runs `certbot renew` every 12 hours.
7. Adds one root cron entry, at 03:15 and 15:15, that reloads nginx so a renewed certificate is actually used. Existing cron entries are kept.

From `/opt/nisccloudstorage` run this. The quoted `ENDFILE` marker matters: the shell must not expand `$` inside the file.

```sh
cat > scripts/init-ssl.sh << 'ENDFILE'
#!/bin/sh
# Issue the Let's Encrypt certificate with the certbot container, switch
# nginx from the HTTP bootstrap to HTTPS, and schedule a reload so renewals
# are picked up. Run this only after DNS points at STORAGE_BIND_IP and
# `docker compose up -d minio minio-init nginx` is already running.

set -eu

cd /opt/nisccloudstorage

if [ ! -f .env ]; then
  echo "Missing /opt/nisccloudstorage/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

: "${DOMAIN_STORAGE:?Set DOMAIN_STORAGE in .env}"
: "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL in .env}"
: "${STORAGE_BIND_IP:?Set STORAGE_BIND_IP in .env}"

if [ "$STORAGE_BIND_IP" = "change_me_storage_ip" ] || [ "$STORAGE_BIND_IP" = "0.0.0.0" ]; then
  echo "STORAGE_BIND_IP must be the dedicated storage address, not $STORAGE_BIND_IP."
  exit 1
fi

echo "Computer:  $(hostname)"
echo "Domain:    $DOMAIN_STORAGE"
echo "Bind IP:   $STORAGE_BIND_IP"
echo "Contact:   $CERTBOT_EMAIL"
echo
echo "The DNS A record for $DOMAIN_STORAGE must be $STORAGE_BIND_IP."
printf "Continue? [y/N] "
read -r confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Aborted."
  exit 1
fi

docker compose run --rm --entrypoint certbot certbot \
  certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$CERTBOT_EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  -d "$DOMAIN_STORAGE"

live="/mnt/storage/letsencrypt/live/$DOMAIN_STORAGE"
if [ ! -f "$live/fullchain.pem" ] || [ ! -f "$live/privkey.pem" ]; then
  echo "Certificate files were not written under $live"
  exit 1
fi

cp nginx/storage-http-redirect.conf nginx/conf.d/storage-http.conf
cp nginx/storage-https.conf nginx/conf.d/storage-https.conf

docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
docker compose up -d certbot

cron_line='15 3,15 * * * cd /opt/nisccloudstorage && docker compose exec -T nginx nginx -s reload'
(
  crontab -l 2>/dev/null | grep -v 'nisccloudstorage && docker compose exec -T nginx nginx -s reload' || true
  echo "$cron_line"
) | crontab -

echo
echo "Certificate is live."
echo "  https://$DOMAIN_STORAGE"
echo "  files: $live"
echo "Certbot renews inside nisccloudstorage-certbot every 12 hours."
echo "Nginx reloads at 03:15 and 15:15 so a renewed certificate is used."
ENDFILE
```

```sh
chmod 755 /opt/nisccloudstorage/scripts/init-ssl.sh
sh /opt/nisccloudstorage/scripts/init-ssl.sh
```

When it prints the domain, the bind IP, and the email, compare them with section 9. Type `y` only if the A record for that domain is that IP.

A successful run ends with `Certificate is live.` and the path of the certificate files.

If certbot says the challenge failed, do not run it again in a loop. Let's Encrypt limits failed tries. Read section 16, fix the cause, then run the script once more.

---

## 14. Prove HTTPS

Replace the name if you did not use `cloudstorage.nisccloud.com`.

```sh
curl -fsSI https://cloudstorage.nisccloud.com/minio/health/live
docker compose ps
ls /mnt/storage/letsencrypt/live/cloudstorage.nisccloud.com
crontab -l
```

You want:

- A status line `HTTP/2 200` or `HTTP/1.1 200`. A certificate warning means the certificate was not issued for this name, or nginx is still on the HTTP-only config.
- `nisccloudstorage-minio` healthy, `nisccloudstorage-nginx` up, `nisccloudstorage-certbot` up, `nisccloudstorage-minio-init` still `Exited (0)`.
- `fullchain.pem` and `privkey.pem` in the live directory.
- A cron line containing `cd /opt/nisccloudstorage && docker compose exec -T nginx nginx -s reload`.

From your PC, not from the server, open `https://cloudstorage.nisccloud.com/minio/health/live` in a browser. An empty page with status 200 is correct. A hosting-panel login page means DNS or the bind address is still wrong.

---

## 15. Values for the application

Set these on the application server, not in the MinIO `.env` a second time. Use the password from `openssl`.

```text
S3_ENDPOINT=https://cloudstorage.nisccloud.com
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=the-password-from-openssl
S3_BUCKET=nisccloudstorage
S3_REGION=us-east-1
```

`S3_ENDPOINT` is `https://` plus `DOMAIN_STORAGE`, with no port and no trailing slash. `S3_BUCKET` is `nisccloudstorage`.

The bucket is public-read. Anyone who knows an object URL can download that object. The init container sets that with `mc anonymous set download`. Presigned URLs use the public name because `MINIO_SERVER_URL` is `https://` plus `DOMAIN_STORAGE`.

---

## 16. Open the admin console

Port 9001 is not on the public internet. From your PC, open a tunnel and leave that window open.

On Windows PowerShell or on a Mac or Linux terminal, replace the address with the hosting server's SSH address (the address you already use to administer the machine, which may be the hosting address rather than the storage address):

```sh
ssh -L 9001:127.0.0.1:9001 root@THE_SERVER_SSH_ADDRESS
```

In a browser on your PC open `http://localhost:9001`.

- User: `minioadmin`
- Password: the `openssl` line you stored

The bucket list must contain `nisccloudstorage`. Do not open port 9001 in the firewall to avoid the tunnel.

---

## 17. After a reboot

The storage disk comes back because of the `fstab` line. Docker comes back because it was enabled. The containers come back because their restart policy is `unless-stopped`. The init container stays exited. That is still success.

```sh
findmnt /mnt/storage
df -h /mnt/storage
docker compose -f /opt/nisccloudstorage/docker-compose.yml ps
curl -fsSI https://cloudstorage.nisccloud.com/minio/health/live
```

You want the mount, the three long-running containers up, the init container exited 0, and HTTP 200.

---

## 18. Everyday commands

Run them from the install directory.

```sh
cd /opt/nisccloudstorage
```

Status, logs, and the CPU and RAM caps:

```sh
docker compose ps
docker compose logs -f minio
docker compose logs --tail 50 certbot
docker stats --no-stream nisccloudstorage-minio nisccloudstorage-nginx
```

Ctrl+C stops following logs. It does not stop MinIO.

Restart one container:

```sh
docker compose restart minio
```

Pull newer images and recreate containers. Files on `/mnt/storage/minio` stay where they are.

```sh
docker compose pull
docker compose up -d
```

Stop the stack without deleting objects or the certificate:

```sh
docker compose stop
```

Start it again:

```sh
docker compose start
```

Objects are deleted only if you delete `/mnt/storage/minio` or format the disk. `docker compose stop`, `docker compose down`, and a reboot do not delete them. `docker compose down -v` is not used here. There is no named Docker volume for the objects. Do not add `-v`.

Renewal is already running inside `nisccloudstorage-certbot`. You do not renew by hand unless you are testing. To test renewal without waiting 12 hours:

```sh
cd /opt/nisccloudstorage
docker compose exec -T certbot certbot renew --webroot -w /var/www/certbot --dry-run
```

`--dry-run` talks to Let's Encrypt's staging service and does not replace the real certificate.

Changing the password or the public name after the first start:

```sh
nano /opt/nisccloudstorage/.env
cd /opt/nisccloudstorage
docker compose up -d --force-recreate
```

Existing objects stay in `/mnt/storage/minio`. The application must use the new password. A new `DOMAIN_STORAGE` also needs the three nginx files updated (section 8.5) and section 13 run again after DNS points at the storage address.

---

## 19. When something fails

**The identify script says there is no empty disk.** Stop. Do not format a `SYSTEM` or `IN_USE` disk.

**prepare-disk says REFUSED.** You typed the operating-system disk, or a disk that is mounted somewhere other than `/mnt/storage`. Run section 4 again and use only the `CANDIDATE` path, or the disk already mounted at `/mnt/storage`.

**prepare-disk says the partition did not appear.** Run `lsblk`. Do not continue. On NVMe the partition is `/dev/nvme0n1p1`, not `/dev/nvme0n11`. The script already picks that name. If the device never showed up, the format did not finish.

**`docker compose up` says address already in use.** Another program has that exact `STORAGE_BIND_IP` and port. Run section 4 again. Do not set the bind address to `0.0.0.0`.

**curl to the storage IP returns a hosting login page.** The hosting web server is still the program answering that address. Stop nginx as shown in section 11. Fix the address. Start nginx again. Do not run the certificate script.

**The init log does not say `Bucket nisccloudstorage ready`.** Check the env file, then run the init container again:

```sh
grep '^MINIO_DEFAULT_BUCKET=' /opt/nisccloudstorage/.env
cd /opt/nisccloudstorage
docker compose up -d --force-recreate minio-init
docker logs nisccloudstorage-minio-init --tail 40
```

**MinIO exits and the log says the drive is not writable, or permission denied.**

```sh
chown 1000:1000 /mnt/storage/minio
chmod 750 /mnt/storage/minio
cd /opt/nisccloudstorage
docker compose up -d minio nginx
```

**SELinux.** Run `getenforce`. If it prints `Enforcing` and the container still cannot write after the `chown`:

```sh
chcon -Rt container_file_t /mnt/storage/minio /mnt/storage/letsencrypt /mnt/storage/certbot
cd /opt/nisccloudstorage
docker compose up -d
```

The compose file already marks the MinIO directory private to that container (`:Z`) and the certificate directories shared by nginx and certbot (`:z`). The `chcon` line is only for the case where that label did not stick.

**The certificate script fails the HTTP challenge.** From the server, this request must be answered by this stack's nginx, not by a hosting page. A 404 is acceptable. HTML from the hosting panel is not.

```sh
curl -fsSI http://STORAGE_BIND_IP/.well-known/acme-challenge/test
getent hosts cloudstorage.nisccloud.com
```

`getent` must return `STORAGE_BIND_IP`. Port 80 from the public internet must reach this server. Fix DNS or the firewall, then run `sh /opt/nisccloudstorage/scripts/init-ssl.sh` once.

**`nginx -t` fails because the pem file is missing.** List the live directory:

```sh
ls /mnt/storage/letsencrypt/live
```

The folder name must equal `DOMAIN_STORAGE`. If you renamed the domain, the `ssl_certificate` lines in `nginx/storage-https.conf` must use that same folder name. Remove a broken HTTPS file from `conf.d` if you need nginx to start again on HTTP only:

```sh
rm -f /opt/nisccloudstorage/nginx/conf.d/storage-https.conf
cd /opt/nisccloudstorage
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

Then fix the name and run the certificate script again.

**Healthcheck stays unhealthy and the log says `curl` is missing inside the MinIO image.** The image you pulled has no `curl`, so the healthcheck in the compose file can never pass, and the init container waits forever. Replace the `healthcheck:` block under `minio` in `/opt/nisccloudstorage/docker-compose.yml` with:

```yaml
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
```

That replacement works only if the `minio/minio` image includes `mc`. If `docker inspect` shows the health command failing with `mc: not found` as well, use a TCP check that does not need either program:

```yaml
    healthcheck:
      test: ["CMD-SHELL", "bash -c 'echo > /dev/tcp/127.0.0.1/9000'"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
```

Then:

```sh
cd /opt/nisccloudstorage
docker compose up -d
```

**You changed `.env` and the old container is still using the old password.** `docker compose up -d` does not always recreate a container when only the env file changed.

```sh
cd /opt/nisccloudstorage
docker compose up -d --force-recreate
```

---

## 20. What this does not change

Customer websites, mail, and databases stay on the system disk. This stack does not create a domain, a proxy, or a certificate in the hosting panel. Ports 9000 and 9001 are not opened on the public address. The only public ports this stack adds are 80 and 443 on `STORAGE_BIND_IP`.

Nothing in this document clones a repository or logs in to GitHub.
