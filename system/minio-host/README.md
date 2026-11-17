# MinIO on the hosting server

MinIO only. Same image, credentials, bucket, and public-read init as `system/docker-compose.yml`. Postgres and the system nginx stack stay where they are. Plesk keeps ports 80 and 443 and proxies one domain to MinIO on localhost.

Data goes to `MINIO_DATA_DIR` on the empty disk. The container is capped at 1 CPU and 1 GB of RAM unless you raise `MINIO_CPU_LIMIT` and `MINIO_MEMORY_LIMIT`. Ports 9000 and 9001 listen on `127.0.0.1` only.

## Install

On the server, with the empty disk already mounted:

```sh
cd system/minio-host
cp .env.example .env
# set MINIO_ROOT_PASSWORD, MINIO_DATA_DIR, MINIO_SERVER_URL
chmod +x install.sh
./install.sh
```

`minio-init` exits 0 after it creates `npanel-uploads` and marks it public-read. That matches the existing stack.

## Plesk

Create or reuse the domain named in `MINIO_SERVER_URL`. Turn off proxy mode and PHP, issue a certificate, and paste `plesk-nginx-directives.conf` into Additional nginx directives.

Point the app at it:

```env
S3_ENDPOINT=https://storage.nisccloud.com
S3_ACCESS_KEY=<MINIO_ROOT_USER>
S3_SECRET_KEY=<MINIO_ROOT_PASSWORD>
S3_BUCKET=npanel-uploads
S3_REGION=us-east-1
```

The console is not public. Tunnel it:

```sh
ssh -L 9001:127.0.0.1:9001 user@the-server
```

Then open `http://localhost:9001`.
