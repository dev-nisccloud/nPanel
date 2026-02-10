# Google Cloud Run Deployment Guide

This guide details how to deploy the **nPanel** application to Google Cloud Run using GitHub Actions. It also covers how to configure a dedicated static outbound IP using Cloud NAT, which is often required for database whitelisting.

## Prerequisites

1.  **Google Cloud Platform (GCP) Account**: You must have an active GCP account and a project.
2.  **Billing Enabled**: Cloud Run and Container Registry/Artifact Registry require billing to be enabled on your project.
3.  **GCP CLI (Optional)**: Useful for local testing and initial setup commands.

## 1. GCP Project Setup

### Enable APIs

You need to enable the following APIs in your GCP project:

-   **Cloud Run API** (`run.googleapis.com`)
-   **Artifact Registry API** (`artifactregistry.googleapis.com`)
-   **Cloud Build API** (`cloudbuild.googleapis.com`)
-   **Compute Engine API** (`compute.googleapis.com`) (Required for Static IP/NAT)

You can enable these via the [GCP Console > APIs & Services > Library](https://console.cloud.google.com/apis/library).

### Create Artifact Registry Repository

This is where your Docker images will be stored.

1.  Go to **Artifact Registry** in the GCP Console.
2.  Click **Create Repository**.
3.  **Name**: `npanel-repo` (or your preferred name).
4.  **Format**: Docker.
5.  **Region**: Select the region where you want to deploy (e.g., `us-central1`).
6.  **Consistency**: **Standard** (default).
7.  **Encryption**: **Google-managed encryption key** (default).
8.  **Immutable image tags**: **Disabled** (Recommended for easier development so you can overwrite tags if necessary).
9.  **Cleanup policies**: Recommended to setup a policy to **Background delete** old images to save costs (e.g., "Keep most recent 10 versions").
10. Click **Create**.

## 2. Dedicated Outbound IP (Static IP)

By default, Cloud Run services use dynamic IPs. To whitelist your application's IP in a database (like MongoDB Atlas or a SQL server), you need to route traffic through a **Cloud NAT** with a static IP.

### Step 2.1: Create a VPC Network

### Step 2.1: Create a VPC Network

If you don't use the `default` VPC, create a new one.

1.  Go to **VPC Network** > **VPC networks**.
2.  Click **Create VPC Network**.
3.  **Name**: `npanel-vpc`.
4.  **Subnets**: Select **Custom** mode.
    *   **New Subnet Name**: `npanel-subnet`.
    *   **Region**: Select the region where you want to deploy (e.g., `us-central1`).
    *   **IP Stack Type**: **IPv4 (Single-stack)**.
    *   **IPv4 Range**: `10.0.0.0/24` (or any valid internal range).
    *   **Private Google Access**: **On** (Recommended to allow internal access to GCP services).
    *   **Flow Logs**: **Off** (unless you need traffic logging).
5.  **MTU**: **1460** (Default).
6.  **Firewall Rules**:
    *   You can leave the default rules selected or select `allow-ssh`, `allow-rdp`, `allow-icmp`, and `allow-internal` if you plan to use this VPC for VMs later. For Cloud Run + NAT, specifically, strict inbound rules aren't as critical since Cloud Run ingress is managed, but `allow-internal` is good practice.
7.  **Dynamic Routing Mode**: **Regional** (Default).
8.  **DNS Armor**: Default/None.
9.  **IPv6 Settings**: **Disable** (unless specifically needed).
10. Click **Create**.

### Step 2.2: Create a Cloud Router and NAT

1.  Go to **Network Services** > **Cloud NAT**.
2.  Click **Get Started** or **Create Cloud NAT Gateway**.
3.  **Name**: `npanel-nat`.
4.  **Network address translation type**: **Public** (required to access the internet).
5.  **Network**: Select `npanel-vpc` (or `default`).
5.  **Region**: Select the region (e.g., `us-central1`).
6.  **Cloud Router**: Select **Create new router**.
    *   **Name**: `npanel-router`.
    *   Click **Create**.
7.  **Cloud NAT mapping**:
    *   **Source**: **Primary and secondary ranges for all subnets**.
8.  **Cloud NAT IP addresses**: Select **Manual**.
    *   **Cloud NAT rules**: Look for the **Default rule** (Priority 65001) section.
        *   *Note: Do not click "Add Rule" to create a new rule with priority < 65000 unless you have complex routing needs. Just use the Default rule.*
    *   **Network Service Tier**: Select **Premium**.
    *   **IP addresses**:
        *   In the **IP address 1** dropdown (inside the Default rule or main section), select **Create IP address**.
        *   **Name**: `npanel-static-ip`.
        *   Click **Reserve**.
        *   Ensure this new IP is selected.
9.  Click **Create**.

### Step 2.3: serverless VPC Access Connector

This connects Cloud Run to your VPC so it can use the NAT.

1.  Go to **VPC Network** > **Serverless VPC access**.
2.  Click **Create Connector**.
3.  **Name**: `npanel-connector`.
4.  **Region**: Must match your Cloud Run and NAT region.
5.  **Network**: Select `npanel-vpc` (or `default`).
6.  **Subnet**: Select **Custom IP range** and enter a CIDR block not in use (e.g., `10.8.0.0/28`).
7.  Click **Create**.

## 3. Service Account and GitHub Secrets

To allow GitHub Actions to deploy to your project, you need a Service Account.

### Create Service Account

1.  Go to **IAM & Admin** > **Service Accounts**.
2.  Click **Create Service Account**.
3.  **Name**: `github-actions-deployer`.
4.  Click **Create and Continue**.

### Grant Permissions

Assign the following roles to the service account:

-   **Cloud Run Admin** (to deploy services)
-   **Amer Artifact Registry Writer** (to push images)
-   **Service Account User** (to run the service)
-   **Viewer** (optional, for verification)

### Create JSON Key

1.  Click on the newly created service account.
2.  Go to the **Keys** tab.
3.  Click **Add Key** > **Create new key**.
4.  Select **JSON**.
5.  The key file will download to your computer. Keep this file safe!

### Add GitHub Secrets

In your GitHub Repository, go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**. Add the following:

-   `GCP_PROJECT_ID`: Your Google Cloud Project ID.
-   `GCP_SA_KEY`: The **entire content** of the JSON key file you just downloaded.
-   `GCP_REGION`: The region (e.g., `us-central1`).
-   `GCP_ARTIFACT_REPO`: The repository name in Artifact Registry (e.g., `npanel-repo`).
-   `PRISMA_BINARY_TARGETS`: Your Prisma binary targets (usually `["native", "debian-openssl-3.0.x"]`).

> **Note**: Ensure `DATABASE_URL` is also set in your GitHub Secrets (using your staging database URL).

---

## 3. Alternative: Configure Workload Identity Federation (Optional)

If your organization blocks Service Account keys, you can use **Workload Identity Federation**. 

### Step 3.1: Create Workload Identity Pool (WIF)
... (existing WIF content) ...


    > **CLI Alternative (If UI Fails - Guaranteed Fix)**
    >
    > If you see "Attribute Condition" errors, it likely means your organization *enforces* a security check that requires mapping more attributes. Use this script:
    >
    ```bash
    # 1. Set environment
    export PROJECT_ID=$(gcloud config get-value project)
    export POOL_ID="npanel-auth-pool-v4"

    # 2. Create Fresh Pool
    gcloud iam workload-identity-pools create "${POOL_ID}" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --display-name="nPanel Auth Pool"

    # 3. Create Provider with ALL common mappings (to satisfy any hidden conditions)
    gcloud iam workload-identity-pools providers create-oidc "github-provider" \
      --project="${PROJECT_ID}" \
      --location="global" \
      --workload-identity-pool="${POOL_ID}" \
      --display-name="GitHub Provider" \
      --issuer-uri="https://token.actions.githubusercontent.com" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner"

    # 4. Success! Now get your values
    export PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
    echo "--- SUCCESS ---"
    echo "PROVIDER_NAME: projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/github-provider"
    ```

### Step 3.3: Grant Access to Service Account

1.  After saving, you should see your new pool and provider.
2.  Click **Grant Access** (top of the page) or go to the Service Account manually.
3.  Select the **Service Account** you created earlier (`github-actions-deployer`).
4.  **Select Principals**:
    *   **Select a principal**: `Set of identities in a pool`.
    *   **Principal**:
        *   **Attribute name**: `repository`
        *   **Attribute value**: `YOUR_GITHUB_USER/YOUR_REPO_NAME` (e.g., `somuo/npanel`).
5.  Click **Save**.
6.  A popup will appear with the **Provider Resource Name** (e.g., `projects/12345/locations/global/workloadIdentityPools/...`). **Copy this string**.

### Step 3.4: Update GitHub Secrets

In your GitHub Repository, go to **Settings** > **Secrets and variables** > **Actions**.
Remove `GCP_SA_KEY` if you added it. Add the following:

-   `GCP_PROJECT_ID`: Your Google Cloud Project ID.
-   `GCP_WIF_PROVIDER`: The **Provider Resource Name** string you copied in Step 3.3.
-   `GCP_SA_EMAIL`: The email of your service account (e.g., `github-actions-deployer@YOUR-PROJECT.iam.gserviceaccount.com`).
-   `GCP_REGION`: The region (e.g., `us-central1`).
-   `GCP_ARTIFACT_REPO`: The repository name (e.g., `npanel-repo`).

> **Note**: Ensure `DATABASE_URL_PRODUCTION` is also set in your GitHub Secrets.

## 4. Deployment Configuration

The deployment workflow `deploy-cloudrun.yml` handles the build and deployment.

> [!NOTE]
> **Automatic Service Creation**: You do **not** need to create the Cloud Run service manually in the GCP Console. The GitHub Action will automatically create a service named `npanel` on its first successful run. However, your **GCP Project** must already exist.

-   It builds the `npanel` app using a Dockerfile.
-   It pushes the image to Artifact Registry.
-   It deploys to Cloud Run with the following flags (adjust in workflow if needed):
    -   `--vpc-connector npanel-connector` (Enables the static IP)
    -   `--vpc-egress all-traffic` (Forces all traffic through the VPC/NAT)

## Troubleshooting

-   **Service Not Found**: Ensure your `GCP_PROJECT_ID` is correct. The first time you deploy, the service is created. Subsequent deploys update it.
-   **Deployment Fails**: Check the GitHub Action logs. Common issues are missing permissions or incorrect region names.
-   **Database Connection Fails**: Ensure your Static IP (created in Step 2.2) is whitelisted in your database provider.
-   **502 Bad Gateway**: Cloud Run health check might be failing. Ensure your app listens on port 3000 (default) or the port specified in `PORT` env var.
