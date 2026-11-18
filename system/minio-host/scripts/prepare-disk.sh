#!/bin/sh
# Create only the Nisc Cloud Storage directories on the existing backup disk.
# Does not format, partition, or remount. Does not touch mail retention or
# Plesk backups.

set -eu

MOUNT=/mnt/backups
ROOT="$MOUNT/nisc-storage"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root."
  exit 1
fi

echo "Nothing will be formatted."
echo
echo "Expected disk:"
echo "  /dev/sdb    about 15 TiB, ext4, mounted at $MOUNT"
echo
echo "Left untouched:"
echo "  $MOUNT/nisc-mail-retention/    Dovecot retention archives"
echo "  $MOUNT/plesk-backups/          Plesk backup storage"
echo
echo "Created if missing:"
echo "  $ROOT/minio/                   all Nisc Cloud Storage objects"
echo "  $ROOT/letsencrypt/             this stack's certificates"
echo "  $ROOT/certbot/                 Let's Encrypt challenge files"
echo

if ! findmnt -n "$MOUNT" >/dev/null 2>&1; then
  echo "REFUSED. $MOUNT is not mounted."
  echo "Mount the existing ext4 filesystem. Do not run mkfs."
  lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT
  exit 1
fi

src=$(findmnt -n -o SOURCE "$MOUNT")
fstype=$(findmnt -n -o FSTYPE "$MOUNT")
echo "Mounted now: $src  fstype=$fstype  on $MOUNT"
df -h "$MOUNT"
echo

case "$src" in
  /dev/sdb|/dev/sdb[0-9]*) ;;
  *)
    echo "REFUSED. $MOUNT is $src, not /dev/sdb."
    exit 1
    ;;
esac

if [ "$fstype" != "ext4" ]; then
  echo "REFUSED. $MOUNT is $fstype, not ext4."
  exit 1
fi

echo "Type KEEP to create only the nisc-storage directories."
printf "> "
read -r go
if [ "$go" != "KEEP" ]; then
  echo "Aborted. No directories were created."
  exit 1
fi

mkdir -p "$ROOT/minio" "$ROOT/letsencrypt" "$ROOT/certbot"
chown 1000:1000 "$ROOT/minio"
chmod 750 "$ROOT/minio"
chmod 755 "$ROOT/letsencrypt" "$ROOT/certbot"

echo
echo "Ready. The disk was not formatted and the mount was not changed."
echo "  objects:      $ROOT/minio"
echo "  certificates: $ROOT/letsencrypt"
echo "  webroot:      $ROOT/certbot"
df -h "$MOUNT"
echo
echo "Other trees on this disk:"
ls -ld "$MOUNT/nisc-mail-retention" "$MOUNT/plesk-backups" 2>/dev/null || true
