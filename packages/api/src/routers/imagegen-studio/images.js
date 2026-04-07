import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { createApi } from "unsplash-js";
import { getImagesSchema } from "./schemas";
const unsplash = createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY ||
        process.env.VITE_PUBLIC_UNSPLASH_ACCESS_KEY ||
        "",
});
const DEFAULT_COLLECTION_IDS = ["317099"];
export const imageGenImagesRouter = router({
    // Get images from Unsplash with pagination and optional search
    list: protectedProcedure
        .input(getImagesSchema)
        .output(z.object({
        data: z.array(z.any()),
        hasMore: z.boolean(),
    }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.session?.user?.id;
        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }
        const { page, perPage, query } = input;
        try {
            let response;
            let totalPages = 1;
            if (query && query.trim().length > 0) {
                // Use search API when query is provided
                const searchResult = await unsplash.search.getPhotos({
                    query: query.trim(),
                    page,
                    perPage,
                });
                if (searchResult.errors) {
                    console.error("Unsplash Search API Error:", searchResult.errors);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to search images from Unsplash",
                    });
                }
                response = searchResult.response.results;
                totalPages = searchResult.response.total_pages;
            }
            else {
                // Use random images when no query
                const images = await unsplash.photos.getRandom({
                    collectionIds: DEFAULT_COLLECTION_IDS,
                    count: perPage,
                });
                if (images.errors) {
                    console.error("Unsplash API Error:", images.errors);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to fetch images from Unsplash",
                    });
                }
                let randomResponse = images.response;
                if (!Array.isArray(randomResponse)) {
                    randomResponse = [randomResponse];
                }
                response = randomResponse;
                // For random images, assume more available if we got the requested amount
                totalPages = response.length === perPage ? page + 1 : page;
            }
            return {
                data: response,
                hasMore: query ? page < totalPages : response.length === perPage,
            };
        }
        catch (error) {
            console.error("Unsplash Fetch Error:", error);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to fetch images",
                cause: error,
            });
        }
    }),
});
