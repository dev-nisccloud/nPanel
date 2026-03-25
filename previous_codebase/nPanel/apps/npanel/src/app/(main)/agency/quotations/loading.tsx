import { Skeleton } from "@/components/ui/skeleton";

export default function QuotationsLoading() {
	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-72" />
				</div>
				<div className="mt-6 flex items-center justify-between gap-4">
					<Skeleton className="h-10 flex-1 max-w-sm" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-10 w-10" />
						<Skeleton className="h-10 w-36" />
					</div>
				</div>
				<div className="mt-6">
					<Skeleton className="h-64 w-full rounded-lg" />
				</div>
			</div>
		</div>
	);
}
