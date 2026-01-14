"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "@/utils/trpc";

type UnsplashImage = {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description?: string;
  links: {
    html: string;
  };
  user: {
    name: string;
  };
};

type ImagesResponse = {
  data: UnsplashImage[];
  hasMore: boolean;
};

export const useGetImages = (searchQuery?: string) => {
  const [page, setPage] = useState(1);
  const [accumulatedImages, setAccumulatedImages] = useState<UnsplashImage[]>([]);
  const prevSearchQueryRef = useRef<string | undefined>(undefined);

  // Reset when search query changes
  useEffect(() => {
    if (prevSearchQueryRef.current !== searchQuery) {
      setPage(1);
      setAccumulatedImages([]);
      prevSearchQueryRef.current = searchQuery;
    }
  }, [searchQuery]);

  // Query for the current page - automatically loads page 1 on mount
  const { data, isLoading, isError, isFetching } = trpc.imageGenStudio.images.list.useQuery({
    page,
    perPage: 20,
    query: searchQuery,
  });

  // Handle data updates when query result changes
  useEffect(() => {
    if (data) {
      const newImages = data.data || [];
      if (page === 1) {
        // First page - set accumulated images
        setAccumulatedImages(newImages);
      } else {
        // Subsequent pages - append to accumulated, avoiding duplicates
        setAccumulatedImages((prev) => {
          const existingIds = new Set(prev.map((img: UnsplashImage) => img.id));
          const uniqueNewImages = newImages.filter((img: UnsplashImage) => !existingIds.has(img.id));
          return [...prev, ...uniqueNewImages];
        });
      }
    }
  }, [data, page]);

  // Use accumulated images if available, otherwise fall back to current query data
  const displayImages = accumulatedImages.length > 0 ? accumulatedImages : (data?.data || []);

  const hasMore = data?.hasMore ?? true; // Default to true to always show load more for random images

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching, isLoading]);

  const resetSearch = useCallback(() => {
    setPage(1);
    setAccumulatedImages([]);
  }, []);

  return {
    data: { data: displayImages },
    isLoading: isLoading && page === 1,
    isError,
    loadMore,
    hasMore,
    isLoadingMore: isFetching && page > 1,
    resetSearch,
  };
};
