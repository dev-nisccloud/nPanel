import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import { createApi } from "unsplash-js";

const unsplash = createApi({
  accessKey:
    process.env.UNSPLASH_ACCESS_KEY ||
    process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ||
    "",
});

const DEFAULT_COUNT = 50;
const DEFAULT_COLLECTION_IDS = ["317099"];

export const imageGenImagesRouter = router({
  // Get random images from Unsplash
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    try {
      const images = await unsplash.photos.getRandom({
        collectionIds: DEFAULT_COLLECTION_IDS,
        count: DEFAULT_COUNT,
      });

      if (images.errors) {
        console.error("Unsplash API Error:", images.errors);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch images from Unsplash",
        });
      }

      let response = images.response;

      if (!Array.isArray(response)) {
        response = [response];
      }

      return { data: response };
    } catch (error) {
      console.error("Unsplash Fetch Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch images",
        cause: error,
      });
    }
  }),
});








