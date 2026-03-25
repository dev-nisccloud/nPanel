import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Use Node.js runtime for UploadThing (required for file operations)

// Create the route handler
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

