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
echo "STORAGE    mounted at /mnt/backups. MinIO uses only nisc-storage there."
echo "CANDIDATE  no mounts. Do not format one while /mnt/backups exists."
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
    if [ "$m" = "/mnt/backups" ]; then
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
  echo "The backup disk is mounted at /mnt/backups. Do not format it."
  echo "MinIO objects go only in /mnt/backups/nisc-storage/minio."
  echo "Leave /mnt/backups/nisc-mail-retention and /mnt/backups/plesk-backups alone."
  echo "Next command: sh /opt/nisccloudstorage/scripts/prepare-disk.sh"
elif [ "$candidates" -eq 0 ]; then
  echo "/mnt/backups is not mounted. Stop. Do not format a SYSTEM or IN_USE disk."
else
  echo "/mnt/backups is not mounted, and unused disks were found."
  echo "This server's storage disk should already be the ~15 TiB ext4 on /dev/sdb."
  echo "Do not format a disk until you confirm it is not already the backup disk."
  awk '$1 == "CANDIDATE" { print "  " $2 }' "$tmp"
fi
echo
echo "STORAGE_BIND_IP must be an address from the addresses section that"
echo "does not already have port 80 taken. Point cloudstorage.nisccloud.com"
echo "at that same address."
