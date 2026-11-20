"use client";

import { useParams } from "react-router";

import { NiscStorageScreen } from "@/components/nisc-storage/storage-screen";
import { trpc } from "@/utils/trpc";

export default function CustomerCloudStoragePage() {
	const params = useParams();
	const slug = typeof params.slug === "string" ? params.slug : "";
	const team = trpc.teams.getTeamIdBySlug.useQuery({ slug }, { enabled: Boolean(slug) });

	return (
		<div className="@container/main flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
				<NiscStorageScreen
					mode="customer"
					teamId={team.data?.id}
					teamSlug={slug}
					teamLoading={team.isLoading}
				/>
			</div>
		</div>
	);
}
