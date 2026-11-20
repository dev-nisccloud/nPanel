"use client";

import { NiscStorageScreen } from "@/components/nisc-storage/storage-screen";

export default function AgencyCloudStoragePage() {
	return (
		<div className="@container/main flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
				<NiscStorageScreen mode="agency" />
			</div>
		</div>
	);
}
