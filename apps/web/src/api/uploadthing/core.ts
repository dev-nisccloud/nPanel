import { auth } from "@npanel/auth";
import { f } from "@/lib/uploadthing";

/**
 * UploadThing file router configuration
 * Define your file upload endpoints here
 */
export const ourFileRouter = {
  // Generic file upload endpoint (supports all file types) - 64MB limit (client enforces 50MB for tickets)
  fileUploader: f({ blob: { maxFileSize: "64MB", maxFileCount: 10 } })
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
  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 20 } })
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

  // Content Calendar Media upload (supports images and videos)
  // Images: up to 10 files, 32MB each
  // Videos: up to 1 file, 500MB (larger than fileUploader for video support)
  contentCalendarMedia: f({
    image: { maxFileSize: "32MB", maxFileCount: 10 },
    video: { maxFileSize: "1GB", maxFileCount: 1 },
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
      console.log("Content calendar media upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  // Email Builder image upload (single image, optimized for email builder library)
  emailBuilderImage: f({ image: { maxFileSize: "16MB", maxFileCount: 1 } })
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
      console.log("Email builder image upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),
};

// Export type for use in client components
export type OurFileRouter = typeof ourFileRouter;

