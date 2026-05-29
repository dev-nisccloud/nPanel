"use client";

import * as React from "react";

import { trpc } from "@/utils/trpc";

export type NebMediaLibraryItem = {
	id: string;
	fileName: string;
	fileUrl: string;
	mimeType?: string;
	createdAt?: Date | string;
};

export type NebMediaLibraryListStatus = "loading" | "empty" | "ready" | "error";

type UseNebMediaLibraryItemsOptions = {
	enabled: boolean;
	search: string;
	pageSize?: number;
};

/**
 * Paginated media library list with stable UI states (avoids empty flash while refetching).
 */
export function useNebMediaLibraryItems({
	enabled,
	search,
	pageSize = 40,
}: UseNebMediaLibraryItemsOptions) {
	const [page, setPage] = React.useState(1);
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [itemsByPage, setItemsByPage] = React.useState<
		Record<number, NebMediaLibraryItem[]>
	>({});

	const utils = trpc.useUtils();

	React.useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);

	const clearPages = React.useCallback(() => {
		setPage(1);
		setItemsByPage({});
	}, []);

	// Refetch when panel opens; keep prior items visible until page 1 data arrives.
	React.useEffect(() => {
		if (!enabled) return;
		void utils.niscEmailBuilder.mediaLibrary.list.invalidate();
	}, [enabled, utils]);

	React.useEffect(() => {
		clearPages();
	}, [debouncedSearch, clearPages]);

	const listQuery = trpc.niscEmailBuilder.mediaLibrary.list.useQuery(
		{
			page,
			limit: pageSize,
			onlyImages: true,
			search: debouncedSearch || undefined,
		},
		{
			enabled,
			staleTime: 15_000,
			refetchOnMount: true,
			refetchOnWindowFocus: false,
		},
	);

	React.useEffect(() => {
		if (!listQuery.data) return;
		const rows = listQuery.data.data as NebMediaLibraryItem[];
		setItemsByPage((prev) => {
			if (page === 1) return { 1: rows };
			return { ...prev, [page]: rows };
		});
	}, [listQuery.data, listQuery.dataUpdatedAt, page]);

	const items = React.useMemo(() => {
		const pageNums = Object.keys(itemsByPage)
			.map(Number)
			.sort((a, b) => a - b);
		const merged: NebMediaLibraryItem[] = [];
		const seen = new Set<string>();
		for (const p of pageNums) {
			for (const item of itemsByPage[p] ?? []) {
				if (!seen.has(item.id)) {
					seen.add(item.id);
					merged.push(item);
				}
			}
		}
		return merged;
	}, [itemsByPage]);

	const status: NebMediaLibraryListStatus = listQuery.isError
		? "error"
		: items.length === 0 &&
				(listQuery.isPending || listQuery.isFetching || !listQuery.isFetched)
			? "loading"
			: items.length === 0 && listQuery.isFetched
				? "empty"
				: "ready";

	const prependItem = React.useCallback((item: NebMediaLibraryItem) => {
		setItemsByPage((prev) => {
			const first = prev[1] ?? [];
			return { ...prev, 1: [item, ...first.filter((i) => i.id !== item.id)] };
		});
	}, []);

	const removeItem = React.useCallback((id: string) => {
		setItemsByPage((prev) => {
			const next: Record<number, NebMediaLibraryItem[]> = {};
			for (const [key, list] of Object.entries(prev)) {
				next[Number(key)] = list.filter((i) => i.id !== id);
			}
			return next;
		});
	}, []);

	return {
		items,
		status,
		page,
		setPage,
		hasMore: listQuery.data?.nextPage != null,
		isFetchingMore: listQuery.isFetching && page > 1,
		isLoading: status === "loading",
		isEmpty: status === "empty",
		isError: status === "error",
		errorMessage: listQuery.error?.message,
		refetch: () => void listQuery.refetch(),
		prependItem,
		removeItem,
		invalidate: () => void utils.niscEmailBuilder.mediaLibrary.list.invalidate(),
	};
}
