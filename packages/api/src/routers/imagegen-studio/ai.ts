import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import Replicate from "replicate";
import { generateImageSchema, removeBgSchema } from "./schemas";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const imageGenAiRouter = router({
  // Generate an image from a prompt
  generateImage: protectedProcedure
    .input(generateImageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const replicateInput = {
          prompt: input.prompt,
          resolution: "2K",
          image_input: [],
          aspect_ratio: "4:3",
          output_format: "png",
          safety_filter_level: "block_only_high",
        };

        const output = await replicate.run("google/nano-banana-pro", {
          input: replicateInput,
        });

        return { data: output as unknown as string };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate image",
        });
      }
    }),

  // Remove background from an image
  removeBg: protectedProcedure
    .input(removeBgSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const replicateInput = {
          image: input.image,
        };

        const output = await replicate.run(
          "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
          { input: replicateInput }
        );

        return { data: output as unknown as string };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove background",
        });
      }
    }),
});








