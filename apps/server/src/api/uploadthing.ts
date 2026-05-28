import { createUploadthing, type FileRouter } from "uploadthing/server";
import { auth } from "@npanel/auth";

const f = createUploadthing();

/**
 * UploadThing file router configuration for Hono backend
 */
export const ourFileRouter: FileRouter = {
  // Generic file upload endpoint
  fileUploader: f({ blob: { maxFileSize: "64MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId, "File url:", file.url);
      return { uploadedBy: metadata.userId };
    }),

  // Image upload endpoint
  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 20 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Document upload endpoint
  documentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    text: { maxFileSize: "32MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Creative Asset version upload
  creativeAssetVersion: f({ blob: { maxFileSize: "1GB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Creative Asset upload
  creativeAsset: f({ blob: { maxFileSize: "1GB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Content Calendar Media upload
  contentCalendarMedia: f({
    image: { maxFileSize: "32MB", maxFileCount: 10 },
    video: { maxFileSize: "1GB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Email Builder image upload
  emailBuilderImage: f({ image: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Zeepo Canvas Media upload
  zeepoCanvasMedia: f({
    image: { maxFileSize: "32MB", maxFileCount: 1 },
    video: { maxFileSize: "1GB", maxFileCount: 1 },
    audio: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),

  // Zeepo Agent chat attachments — blob (same as creative assets) so JPEG/PNG with empty MIME still upload
  zeepoAgentAttachment: f({ blob: { maxFileSize: "16MB", maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
