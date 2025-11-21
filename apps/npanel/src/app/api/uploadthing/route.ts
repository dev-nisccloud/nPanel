import { createRouteHandler } from "uploadthing/next";
import { UTApi } from "uploadthing/server";
import { auth } from "@nPanel/auth";
import { f } from "@/lib/uploadthing";

// Use Node.js runtime for UploadThing (required for file operations)
export const runtime = "nodejs";

/**
 * UploadThing file router configuration
 * Define your file upload endpoints here
 */
export const ourFileRouter = {
  // Generic file upload endpoint (supports all file types)
  fileUploader: f({ blob: { maxFileSize: "32MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File url:", file.url);
      return { uploadedBy: metadata.userId };
    }),

  // Image upload endpoint (optimized for images)
  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  // Document upload endpoint
  documentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    text: { maxFileSize: "32MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  // Creative Asset version upload (supports all file types)
  creativeAssetVersion: f({ blob: { maxFileSize: "1GB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Creative asset upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  // Creative Asset upload (supports all file types)
  creativeAsset: f({ blob: { maxFileSize: "1GB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      return {
        userId: session.user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Creative asset upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),
};

// Create the route handler
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

/**
 * Server-side utility for file operations
 * Use this for server-side file deletion, etc.
 */
export const utapi = new UTApi();

// Export types for use in client components
export type OurFileRouter = typeof ourFileRouter;

