import { Skeleton } from "@/components/ui/skeleton";

export default function QuotationDetailLoading() {
	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 py-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Skeleton className="h-9 w-28" />
					<div>
						<Skeleton className="h-7 w-48 mb-2" />
						<Skeleton className="h-4 w-64" />
					</div>
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-9 w-36" />
				</div>
			</div>
			<div className="flex justify-center">
				<Skeleton className="h-[842px] w-[595px] rounded-lg" />
			</div>
		</div>
	);
}
