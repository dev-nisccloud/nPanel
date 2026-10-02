import { AsyncLocalStorage } from "node:async_hooks";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Client, FileInfo, enterPassiveModeIPv4 } from "basic-ftp";
import { posix } from "path";

import {
  createFtpDownloadUrl,
  isOptionalFtpSizeError,
  safeFtpDownloadName,
} from "../../lib/plesk/ftp-download";
import {
  createFtpExtractUrl,
  createFtpUploadUrl,
  FTP_EXTRACT_MAX_BYTES,
  FTP_UPLOAD_MAX_BYTES,
  safeRemotePath,
} from "../../lib/plesk/ftp-transfer";
import { protectedProcedure, router } from "../../trpc";

const ftpViewerRole = new AsyncLocalStorage<string | null>();

const ftpProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  return ftpViewerRole.run(ctx.session?.user?.role ?? null, () => next());
});

/** Fallback when the failure is unexpected. Known FTP failures get a specific message. */
const FTP_USER_ERROR_MESSAGE =
  "An error occurred. Please try again later or contact support.";

function ftpErrorText(error: unknown): { code?: string; text: string } {
  if (!error || typeof error !== "object") {
    return { text: String(error) };
  }

  const record = error as { code?: unknown; message?: unknown };
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    text: error instanceof Error ? error.message : String(record.message ?? error),
  };
}

/**
 * Map transport and FTP reply failures to client-safe messages.
 * Codes in the server's expected-error set are not reported to Sentry.
 */
function ftpReplyStartsWith(text: string, replyCode: string): boolean {
  return new RegExp(`^\\s*${replyCode}\\b`, "i").test(text);
}

function classifyFtpError(error: unknown): { code: TRPCError["code"]; message: string } {
  const { code, text } = ftpErrorText(error);
  const normalizedCode = (code ?? "").toUpperCase();
  const haystack = text.toLowerCase();

  if (
    ["ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH", "ENETUNREACH", "EAI_AGAIN"].includes(
      normalizedCode,
    ) ||
    /\b(econnrefused|enotfound|ehostunreach|enetunreach|eai_again|getaddrinfo)\b/i.test(text)
  ) {
    return {
      code: "PRECONDITION_FAILED",
      message:
        "Could not reach the hosting server. The file service may be offline. Please try again in a few minutes.",
    };
  }

  if (
    normalizedCode === "ETIMEDOUT" ||
    normalizedCode === "ESOCKETTIMEDOUT" ||
    /^timeout\b/i.test(text) ||
    /\btimed out\b/i.test(text) ||
    /\betimedout\b/i.test(text)
  ) {
    return {
      code: "TIMEOUT",
      message: "The hosting server took too long to respond. Please try again.",
    };
  }

  if (
    normalizedCode === "ECONNRESET" ||
    normalizedCode === "EPIPE" ||
    /\b(econnreset|epipe)\b/i.test(text) ||
    haystack.includes("socket disconnected") ||
    haystack.includes("client is closed") ||
    haystack.includes("connection closed") ||
    haystack.includes("connection reset")
  ) {
    return {
      code: "PRECONDITION_FAILED",
      message: "The connection to the hosting server was interrupted. Please try again.",
    };
  }

  if (
    haystack.includes("unable to verify") ||
    haystack.includes("self signed") ||
    haystack.includes("ssl routines") ||
    haystack.includes("certificate") ||
    haystack.includes("secure tls") ||
    haystack.includes("tls handshake")
  ) {
    return {
      code: "PRECONDITION_FAILED",
      message:
        "A secure connection to the hosting server could not be established. Please try again later.",
    };
  }

  if (
    ftpReplyStartsWith(text, "530") ||
    haystack.includes("login incorrect") ||
    haystack.includes("login authentication failed") ||
    haystack.includes("authentication failed") ||
    haystack.includes("not logged in")
  ) {
    return {
      code: "FORBIDDEN",
      message: "The hosting login was rejected. Check the FTP username and password, then try again.",
    };
  }

  if (
    haystack.includes("permission denied") ||
    haystack.includes("access denied") ||
    haystack.includes("not permitted") ||
    haystack.includes("operation not permitted")
  ) {
    return {
      code: "FORBIDDEN",
      message: "You don't have permission to access this file or folder.",
    };
  }

  if (
    haystack.includes("disk quota") ||
    haystack.includes("quota exceeded") ||
    haystack.includes("no space left") ||
    haystack.includes("disk full")
  ) {
    return {
      code: "PAYLOAD_TOO_LARGE",
      message: "The hosting account is out of space, so this change could not be saved.",
    };
  }

  if (
    haystack.includes("no such file") ||
    haystack.includes("no such directory") ||
    haystack.includes("does not exist") ||
    haystack.includes("not found")
  ) {
    return {
      code: "NOT_FOUND",
      message: "That file or folder could not be found. It may have been moved or deleted.",
    };
  }

  if (
    ["421", "425", "426", "450", "451"].some((replyCode) => ftpReplyStartsWith(text, replyCode)) ||
    haystack.includes("service not available") ||
    haystack.includes("can't open data connection") ||
    haystack.includes("cannot open data connection")
  ) {
    return {
      code: "PRECONDITION_FAILED",
      message: "The hosting server closed the file connection. Please try again.",
    };
  }

  if (
    ftpReplyStartsWith(text, "553") ||
    haystack.includes("file name not allowed") ||
    haystack.includes("invalid filename")
  ) {
    return {
      code: "BAD_REQUEST",
      message: "The file name or path is not allowed on the hosting server.",
    };
  }

  if (ftpReplyStartsWith(text, "550")) {
    return {
      code: "NOT_FOUND",
      message:
        "The hosting server rejected this file or folder. It may be missing, or you may not have access.",
    };
  }

  return {
    code: "INTERNAL_SERVER_ERROR",
    message: FTP_USER_ERROR_MESSAGE,
  };
}

function ftpDetail(error: unknown): string {
  const { code, text } = ftpErrorText(error);
  return [code, text].filter((part) => part && part.trim()).join(": ").replace(/\s+/g, " ").trim().slice(0, 500);
}

function ftpUserError(error: unknown, role = ftpViewerRole.getStore()): TRPCError {
  const reveal = role?.trim().toUpperCase() === "AGENCY_SUPER_ADMIN";
  console.error("FTP operation failed:", error);
  if (error instanceof TRPCError) {
    if (reveal) return error;
    return new TRPCError({
      code: error.code,
      message: FTP_USER_ERROR_MESSAGE,
    });
  }
  const classified = classifyFtpError(error);
  const detail = ftpDetail(error);
  return new TRPCError({
    code: classified.code,
    message: reveal && detail ? detail : FTP_USER_ERROR_MESSAGE,
  });
}

// FTP Connection Schema
const ftpConnectionSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1).max(65535).default(21),
  user: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  secure: z.boolean().default(true), // Default to FTPS
  timeout: z.number().min(1000).default(300000), // 5 minutes default for large files
});

// File/Directory Info Schema
const fileInfoSchema = z.object({
  name: z.string(),
  type: z.enum(["file", "directory"]),
  size: z.number().optional(),
  date: z.string().optional(), // Changed to string to handle Date serialization
  permissions: z.any().optional(), // Changed to any to handle UnixPermissions
  owner: z.string().optional(),
  group: z.string().optional(),
});

// FTP Operations Schema
const listSchema = z.object({
  credentials: ftpConnectionSchema,
  path: z.string().optional().default("/"),
});

const uploadSchema = z.object({
  credentials: ftpConnectionSchema,
  localPath: z.string().min(1, "Local path is required"),
  remotePath: z.string().min(1, "Remote path is required"),
});

const uploadFileSchema = z.object({
  credentials: ftpConnectionSchema,
  fileName: z.string().min(1, "File name is required"),
  remotePath: z.string().min(1, "Remote path is required"),
  size: z.number().int().nonnegative().max(FTP_UPLOAD_MAX_BYTES),
});

const downloadSchema = z.object({
  credentials: ftpConnectionSchema,
  remotePath: z.string().min(1, "Remote path is required"),
  localPath: z.string().min(1, "Local path is required"),
});

const renameSchema = z.object({
  credentials: ftpConnectionSchema,
  oldPath: z.string().min(1, "Old path is required"),
  newPath: z.string().min(1, "New path is required"),
});

const deleteSchema = z.object({
  credentials: ftpConnectionSchema,
  path: z.string().min(1, "Path is required").transform((p) => String(p).trim()),
});

// Long timeout for delete (recursive dir delete can take many minutes for node_modules etc.)
const DELETE_OPERATION_TIMEOUT_MS = 600_000; // 10 minutes

// Enhanced download schemas
const downloadFileSchema = z.object({
  credentials: ftpConnectionSchema,
  remotePath: z.string().min(1, "Remote path is required"),
});

const downloadFolderSchema = z.object({
  credentials: ftpConnectionSchema,
  remotePath: z.string().min(1, "Remote path is required"),
  folderName: z.string().min(1, "Folder name is required"),
});

const createDirSchema = z.object({
  credentials: ftpConnectionSchema,
  path: z.string().min(1, "Directory path is required"),
});

const fileInfoRequestSchema = z.object({
  credentials: ftpConnectionSchema,
  path: z.string().min(1, "Path is required"),
});

// Helper function to create FTP client
async function createFtpClient(credentials: z.infer<typeof ftpConnectionSchema>) {
  const client = new Client(credentials.timeout);
  // Some servers reset TLS data sockets on EPSV/IPv6.
  // Force passive IPv4 mode for more stable transfers.
  client.prepareTransfer = enterPassiveModeIPv4;
  
  try {
    await client.access({
      host: credentials.host,
      port: credentials.port,
      user: credentials.user,
      password: credentials.password,
      secure: credentials.secure,
    });
    
    return client;
  } catch (error) {
    try {
      client.close();
    } catch {
      // The socket may already be closed after a refused connection.
    }
    throw ftpUserError(error);
  }
}

async function reconnectFtpClient(
  client: Client,
  credentials: z.infer<typeof ftpConnectionSchema>
) {
  try {
    client.close();
  } catch {
    // Ignore close errors during reconnect.
  }

  await client.access({
    host: credentials.host,
    port: credentials.port,
    user: credentials.user,
    password: credentials.password,
    secure: credentials.secure,
  });
}

function isRetryableTransferError(error: unknown): boolean {
  const { code, text } = ftpErrorText(error);
  const haystack = `${code ?? ""} ${text}`;
  return (
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    code === "ETIMEDOUT" ||
    haystack.includes("ECONNRESET") ||
    haystack.includes("EPIPE") ||
    haystack.includes("ETIMEDOUT") ||
    haystack.includes("Client is closed") ||
    haystack.includes("socket disconnected") ||
    haystack.includes("secure TLS connection") ||
    haystack.includes("Timeout") ||
    haystack.includes("connection closed") ||
    haystack.includes("426")
  );
}

async function uploadWithRetry(
  client: Client,
  credentials: z.infer<typeof ftpConnectionSchema>,
  localPath: string,
  remotePath: string,
  maxRetries = 3
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.uploadFrom(localPath, remotePath);
      return;
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < maxRetries && isRetryableTransferError(error);
      if (!shouldRetry) {
        throw error;
      }
      await reconnectFtpClient(client, credentials);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Upload failed");
}

async function downloadWithRetry(
  client: Client,
  credentials: z.infer<typeof ftpConnectionSchema>,
  localPath: string,
  remotePath: string,
  maxRetries = 3
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.downloadTo(localPath, remotePath);
      return;
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < maxRetries && isRetryableTransferError(error);
      if (!shouldRetry) {
        throw error;
      }
      await reconnectFtpClient(client, credentials);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Download failed");
}

// Helper function to parse raw LIST output
function parseRawListOutput(rawOutput: string): any[] {
  const lines = rawOutput.split('\n').filter(line => line.trim());
  const files: any[] = [];
  
  for (const line of lines) {
    if (line.trim()) {
      // Parse Unix-style LIST output
      // Format: permissions links owner group size date time name
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 9) {
        const permissions = parts[0];
        const owner = parts[2];
        const group = parts[3];
        const sizeStr = parts[4];
        const name = parts.slice(8).join(' ');
        
        const isDirectory = permissions?.startsWith('d') ?? false;
        const size = sizeStr ? parseInt(sizeStr) || 0 : 0;
        
        files.push({
          name,
          isDirectory,
          size: isDirectory ? undefined : size,
          user: owner,
          group,
          permissions: permissions || "644",
          date: new Date(), // We'll use current date as fallback
        });
      }
    }
  }
  
  return files;
}

// Helper function to transform FileInfo to our schema
function transformFileInfo(fileInfo: FileInfo): z.infer<typeof fileInfoSchema> {
  return {
    name: fileInfo.name,
    type: fileInfo.isDirectory ? "directory" : "file",
    size: fileInfo.size,
    date: fileInfo.date ? String(fileInfo.date) : undefined,
    permissions: fileInfo.permissions?.toString(), // Convert UnixPermissions to string
    owner: fileInfo.user,
    group: fileInfo.group,
  };
}

// True if the FTP error means "path does not exist" (safe to ignore when deleting)
function isNoSuchFileError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes("no such file or directory") ||
    msg.includes("not found") ||
    msg.includes("does not exist")
  );
}

// Recursively remove a directory: list contents, delete files and subdirs, then remove empty dir.
// Ignores 550 "No such file or directory" (symlinks, already deleted, etc.) so deletion can complete.
// Sends NOOP every N operations to keep the control connection alive during long deletes.
const KEEPALIVE_EVERY_N_OPS = 100;

async function removeDirectoryRecursive(
  client: Client,
  dirPath: string,
  opCount: { current: number }
): Promise<void> {
  let list: FileInfo[];
  try {
    list = await client.list(dirPath);
  } catch (listErr) {
    if (isNoSuchFileError(listErr)) {
      return;
    }
    throw listErr;
  }

  for (const file of list) {
    if (opCount.current > 0 && opCount.current % KEEPALIVE_EVERY_N_OPS === 0) {
      try {
        await client.send("NOOP");
      } catch {
        // Ignore NOOP errors
      }
    }
    opCount.current += 1;

    const fullPath = dirPath === "/" ? `/${file.name}` : `${dirPath}/${file.name}`;
    try {
      if (file.isDirectory) {
        await removeDirectoryRecursive(client, fullPath, opCount);
      } else {
        await client.remove(fullPath);
      }
    } catch (err) {
      if (!isNoSuchFileError(err)) {
        throw err;
      }
    }
  }

  try {
    await client.removeDir(dirPath);
  } catch (err) {
    if (!isNoSuchFileError(err)) {
      throw err;
    }
  }
}

function ftpCredentials(credentials: z.infer<typeof ftpConnectionSchema>) {
  return {
    host: credentials.host,
    port: credentials.port,
    user: credentials.user,
    password: credentials.password,
    secure: credentials.secure,
    timeout: Math.max(credentials.timeout, 300_000),
  };
}

export const ftpRouter = router({
  // Test FTP connection
  testConnection: ftpProcedure
    .input(ftpConnectionSchema)
    .query(async ({ input }) => {
      const client = await createFtpClient(input);
      try {
        const currentPath = await client.pwd();
        return { 
          success: true, 
          currentPath, 
          message: "FTP connection successful" 
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // List files and directories
  list: ftpProcedure
    .input(listSchema)
    .query(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        // Try different listing methods
        let files;
        
        // Method 1: Try regular list (MLSD)
        try {
          files = await client.list(input.path);
        } catch (listError) {
          // Method 2: Try raw LIST command
          const rawList = await client.send("LIST " + input.path);
          
          // Parse raw LIST output manually
          files = parseRawListOutput(rawList.message);
        }
        
        const transformedFiles = files.map(transformFileInfo);
        
        return {
          success: true,
          data: transformedFiles,
          path: input.path,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Get current working directory
  pwd: ftpProcedure
    .input(z.object({ credentials: ftpConnectionSchema }))
    .query(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        const currentPath = await client.pwd();
        return {
          success: true,
          data: currentPath,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Change directory
  cd: ftpProcedure
    .input(z.object({
      credentials: ftpConnectionSchema,
      path: z.string().min(1, "Path is required"),
    }))
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.cd(input.path);
        const newPath = await client.pwd();
        return {
          success: true,
          data: newPath,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Get file information
  getFileInfo: ftpProcedure
    .input(fileInfoRequestSchema)
    .query(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        const size = await client.size(input.path);
        const lastMod = await client.lastMod(input.path);
        
        return {
          success: true,
          data: {
            path: input.path,
            size,
            lastModified: lastMod,
          },
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Upload file (server-side)
  upload: ftpProcedure
    .input(uploadSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await uploadWithRetry(client, input.credentials, input.localPath, input.remotePath);
        return {
          success: true,
          message: `File uploaded successfully to ${input.remotePath}`,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Mint a short-lived upload URL. The browser PUTs the raw file to that URL.
  uploadFile: ftpProcedure
    .input(uploadFileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        const directory = safeRemotePath(input.remotePath.startsWith("/") ? input.remotePath : `/${input.remotePath}`);
        const fileName = safeFtpDownloadName(input.fileName, "upload");
        if (!directory || !fileName || fileName === "." || fileName === "..") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The file name or path is not allowed.",
          });
        }

        const remotePath = directory === "/" ? `/${fileName}` : `${directory}/${fileName}`;
        const url = createFtpUploadUrl({
          uid: userId,
          remotePath,
          maxBytes: input.size,
          credentials: ftpCredentials(input.credentials),
        });
        return { success: true as const, url, remotePath, filename: fileName };
      } catch (error) {
        throw ftpUserError(error);
      }
    }),

  // Download file
  download: ftpProcedure
    .input(downloadSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await downloadWithRetry(client, input.credentials, input.localPath, input.remotePath);
        return {
          success: true,
          message: `File downloaded successfully to ${input.localPath}`,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Rename file or directory
  rename: ftpProcedure
    .input(renameSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.rename(input.oldPath, input.newPath);
        return {
          success: true,
          message: `Successfully renamed ${input.oldPath} to ${input.newPath}`,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Delete file
  deleteFile: ftpProcedure
    .input(deleteSchema)
    .mutation(async ({ input }) => {
      const path = typeof input.path === "string" ? input.path.trim() : String(input.path).trim();
      if (!path) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Path is required",
        });
      }
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.remove(path);
        return {
          success: true,
          message: `File ${path} deleted successfully`,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Delete directory (recursive: we list, delete contents, then remove empty dir)
  deleteDirectory: ftpProcedure
    .input(deleteSchema)
    .mutation(async ({ input }) => {
      const path = typeof input.path === "string" ? input.path.trim() : String(input.path).trim();
      if (!path) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Path is required",
        });
      }
      const credentialsWithLongTimeout = {
        ...input.credentials,
        timeout: Math.max(
          input.credentials.timeout ?? 30_000,
          DELETE_OPERATION_TIMEOUT_MS
        ),
      };
      const client = await createFtpClient(credentialsWithLongTimeout);

      try {
        await removeDirectoryRecursive(client, path, { current: 0 });
        return {
          success: true,
          message: `Directory ${path} deleted successfully`,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Create directory
  createDirectory: ftpProcedure
    .input(createDirSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.ensureDir(input.path);
        return {
          success: true,
          message: `Directory ${input.path} created successfully`,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),


  // Get FTP server features
  getFeatures: ftpProcedure
    .input(z.object({ credentials: ftpConnectionSchema }))
    .query(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        const features = await client.features();
        return {
          success: true,
          data: Object.fromEntries(features),
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Download single file. Bytes are streamed from GET /api/hosting/ftp/download.
  downloadFile: ftpProcedure
    .input(downloadFileSchema)
    .mutation(async ({ input, ctx }) => {
      const client = await createFtpClient(input.credentials);
      try {
        try {
          await client.size(input.remotePath);
        } catch (error) {
          if (!isOptionalFtpSizeError(error)) throw error;
        }

        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        const filename = safeFtpDownloadName(input.remotePath.split("/").pop(), "download");
        const url = createFtpDownloadUrl({
          uid: userId,
          kind: "file",
          filename,
          remotePath: input.remotePath,
          credentials: {
            host: input.credentials.host,
            port: input.credentials.port,
            user: input.credentials.user,
            password: input.credentials.password,
            secure: input.credentials.secure,
            timeout: Math.max(input.credentials.timeout, 300_000),
          },
        });
        return { success: true as const, url, filename };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Download folder as a streamed zip. Listing the tree happens on the download stream.
  downloadFolder: ftpProcedure
    .input(downloadFolderSchema)
    .mutation(async ({ input, ctx }) => {
      const client = await createFtpClient(input.credentials);
      try {
        const remotePath = safeRemotePath(
          input.remotePath.startsWith("/") ? input.remotePath : `/${input.remotePath}`,
        );
        if (!remotePath) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The folder path is not allowed.",
          });
        }
        await client.list(remotePath);

        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        const filename = safeFtpDownloadName(`${input.folderName}.zip`, "folder.zip");
        const url = createFtpDownloadUrl({
          uid: userId,
          kind: "folder",
          filename,
          remotePath,
          folderName: input.folderName,
          credentials: ftpCredentials(input.credentials),
        });
        return { success: true as const, url, filename };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Mint a text-view URL. The browser GETs the file body from that URL.
  readFile: ftpProcedure
    .input(z.object({
      credentials: ftpConnectionSchema,
      remotePath: z.string().min(1, "Remote path is required"),
      maxSize: z.number().optional().default(5 * 1024 * 1024),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        const remotePath = safeRemotePath(
          input.remotePath.startsWith("/") ? input.remotePath : `/${input.remotePath}`,
        );
        if (!remotePath || remotePath === "/") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The file path is not allowed.",
          });
        }

        const maxBytes = Math.min(Math.max(input.maxSize ?? 5 * 1024 * 1024, 1), 5 * 1024 * 1024);
        const filename = safeFtpDownloadName(remotePath.split("/").pop(), "file");
        const url = createFtpDownloadUrl({
          uid: userId,
          kind: "text",
          filename,
          remotePath,
          maxBytes,
          credentials: ftpCredentials(input.credentials),
        });
        return { success: true as const, url, filename };
      } catch (error) {
        throw ftpUserError(error);
      }
    }),


  // Mint an extract URL. The browser POSTs that URL and the server unpacks the archive.
  extractZip: ftpProcedure
    .input(z.object({
      credentials: ftpConnectionSchema,
      zipPath: z.string().min(1, "Zip file path is required"),
      extractTo: z.string().optional().default(""),
      overwrite: z.boolean().default(false),
      maxSize: z.number().optional().default(FTP_EXTRACT_MAX_BYTES),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session?.user?.id;
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required",
          });
        }

        const zipPath = safeRemotePath(input.zipPath.startsWith("/") ? input.zipPath : `/${input.zipPath}`);
        if (!zipPath || zipPath === "/") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The archive path is not allowed.",
          });
        }

        const requested = input.extractTo.trim();
        const extractTo = safeRemotePath(
          requested
            ? requested.startsWith("/") ? requested : `/${requested}`
            : posix.dirname(zipPath),
        );
        if (!extractTo) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The extract folder path is not allowed.",
          });
        }

        const maxBytes = Math.min(Math.max(input.maxSize ?? FTP_EXTRACT_MAX_BYTES, 1), FTP_EXTRACT_MAX_BYTES);
        const url = createFtpExtractUrl({
          uid: userId,
          zipPath,
          extractTo,
          overwrite: input.overwrite,
          maxBytes,
          credentials: ftpCredentials(input.credentials),
        });
        return { success: true as const, url };
      } catch (error) {
        throw ftpUserError(error);
      }
    }),
});
