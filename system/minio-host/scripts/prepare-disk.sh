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
