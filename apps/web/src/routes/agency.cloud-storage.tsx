"use client";

import { CloudStorageBrowser } from "./agency.cloud-storage/_components/cloud-storage-browser";

export default function AgencyCloudStoragePage() {
  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <CloudStorageBrowser />
      </div>
    </div>
  );
}
