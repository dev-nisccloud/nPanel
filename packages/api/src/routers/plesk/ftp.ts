import { AsyncLocalStorage } from "node:async_hooks";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Client, FileInfo, enterPassiveModeIPv4 } from "basic-ftp";
import AdmZip from "adm-zip";
import { createReadStream, unlinkSync, existsSync, mkdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";

import {
  createFtpDownloadUrl,
  isOptionalFtpSizeError,
  safeFtpDownloadName,
} from "../../lib/plesk/ftp-download";
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
  fileData: z.string(), // Base64 encoded file data
  fileName: z.string().min(1, "File name is required"),
  remotePath: z.string().min(1, "Remote path is required"),
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

// Helper function to recursively list all files in a directory.
// The root listing must fail loudly. Nested listing failures are skipped.
async function getAllFilesRecursively(
  client: Client,
  dirPath: string,
  options?: { throwOnListError?: boolean; skipped?: { count: number } },
): Promise<any[]> {
  const allFiles: any[] = [];
  
  try {
    const files = await client.list(dirPath);
    console.log(`Listing directory ${dirPath}, found ${files.length} items:`, files.map(f => ({ name: f.name, isDirectory: f.isDirectory })));
    
    for (const file of files) {
      const fullPath = dirPath === "/" ? `/${file.name}` : `${dirPath}/${file.name}`;
      const fileInfo = {
        ...transformFileInfo(file),
        path: fullPath,
      };
      
      // If it's a directory, recursively get its contents
      if (file.isDirectory) {
        console.log(`Recursively processing directory: ${fullPath}`);
        const subFiles = await getAllFilesRecursively(client, fullPath, {
          skipped: options?.skipped,
        });
        allFiles.push(...subFiles);
      } else {
        // Only add files, not directories
        console.log(`Adding file: ${fullPath}`);
        allFiles.push(fileInfo);
      }
    }
  } catch (error) {
    if (options?.throwOnListError) {
      throw error;
    }
    console.error(`Error listing directory ${dirPath}:`, error);
    if (options?.skipped) {
      options.skipped.count += 1;
    }
  }
  
  return allFiles;
}

// Helper function to create a temporary file path
function createTempFilePath(extension: string = "tmp"): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  return join(tmpdir(), `ftp-download-${timestamp}-${randomId}.${extension}`);
}

// Helper function to cleanup temporary files
function cleanupTempFile(filePath: string): void {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filePath}:`, error);
  }
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

  // Upload file from browser (base64 data)
  uploadFile: ftpProcedure
    .input(uploadFileSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      let tempFilePath: string | null = null;
      
      try {
        // Create temporary file path
        tempFilePath = createTempFilePath();
        
        // Convert base64 to buffer and write to temp file
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const fs = require('fs');
        fs.writeFileSync(tempFilePath, fileBuffer);
        
        // Construct remote path
        const remotePath = input.remotePath.endsWith('/') 
          ? `${input.remotePath}${input.fileName}` 
          : `${input.remotePath}/${input.fileName}`;
        
        // Upload file
        await uploadWithRetry(client, input.credentials, tempFilePath, remotePath);
        
        return {
          success: true,
          message: `File ${input.fileName} uploaded successfully to ${remotePath}`,
          remotePath,
        };
      } catch (error) {
        throw ftpUserError(error);
      } finally {
        // Cleanup temp file
        if (tempFilePath) {
          cleanupTempFile(tempFilePath);
        }
        client.close();
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

  // Download folder as a streamed zip.
  downloadFolder: ftpProcedure
    .input(downloadFolderSchema)
    .mutation(async ({ input, ctx }) => {
      const client = await createFtpClient(input.credentials);
      try {
        const allFiles = await getAllFilesRecursively(client, input.remotePath, {
          throwOnListError: true,
          skipped: { count: 0 },
        });
        if (allFiles.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This folder is empty, so there is nothing to download.",
          });
        }

        const maxFolderSize = 500 * 1024 * 1024;
        const totalSize = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalSize > maxFolderSize) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: `Folder too large (${Math.round(totalSize / 1024 / 1024)}MB). Maximum allowed size is 500MB.`,
          });
        }

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
          remotePath: input.remotePath,
          folderName: input.folderName,
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

  // Read file content as text (for file viewer)
  readFile: ftpProcedure
    .input(z.object({
      credentials: ftpConnectionSchema,
      remotePath: z.string().min(1, "Remote path is required"),
      maxSize: z.number().optional().default(5 * 1024 * 1024), // Default 5MB limit
    }))
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      let tempFilePath: string | null = null;
      
      try {
        console.log(`Reading file: ${input.remotePath}`);
        
        // Check file size before downloading
        const fileSize = await client.size(input.remotePath);
        if (fileSize && fileSize > input.maxSize!) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `File size (${fileSize} bytes) exceeds the maximum viewing limit (${input.maxSize} bytes)`,
          });
        }
        
        // Create temporary file path
        tempFilePath = createTempFilePath();
        
        // Download file with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await downloadWithRetry(client, input.credentials, tempFilePath, input.remotePath, 1);
            break;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            
            if (isRetryableTransferError(error)) {
              await reconnectFtpClient(client, input.credentials);
            }
          }
        }
        
        // Read the downloaded file as text
        return new Promise<{ success: boolean; content: string; filename: string; encoding: string }>((resolve, reject) => {
          const role = ftpViewerRole.getStore();
          const fileBuffer = createReadStream(tempFilePath!);
          const chunks: Buffer[] = [];
          
          fileBuffer.on('data', (chunk: string | Buffer) => {
            if (Buffer.isBuffer(chunk)) {
              chunks.push(chunk);
            } else {
              chunks.push(Buffer.from(chunk));
            }
          });
          
          fileBuffer.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const filename = input.remotePath.split('/').pop() || 'file';
            
            // Try UTF-8 first, fallback to latin1
            let content = '';
            let encoding = 'utf-8';
            
            try {
              content = buffer.toString('utf-8');
              // Check if the text is valid UTF-8
              if (content.includes('\uFFFD')) {
                content = buffer.toString('latin1');
                encoding = 'latin1';
              }
            } catch {
              content = buffer.toString('latin1');
              encoding = 'latin1';
            }
            
            // Cleanup temp file
            cleanupTempFile(tempFilePath!);
            
            resolve({
              success: true,
              content,
              filename,
              encoding,
            });
          });
          
          fileBuffer.on('error', (error) => {
            cleanupTempFile(tempFilePath!);
            reject(ftpUserError(error, role));
          });
        });
        
      } catch (error) {
        if (tempFilePath) {
          cleanupTempFile(tempFilePath);
        }
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),

  // Extract zip file
  extractZip: ftpProcedure
    .input(z.object({
      credentials: ftpConnectionSchema,
      zipPath: z.string().min(1, "Zip file path is required"),
      extractTo: z.string().optional().default(""), // Empty string means extract to same directory as zip
      overwrite: z.boolean().default(false),
      maxSize: z.number().optional().default(500 * 1024 * 1024), // Default 500MB limit
    }))
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      let tempZipPath: string | null = null;
      let tempExtractPath: string | null = null;
      
      try {
        // Check if zip file exists and get its size
        const zipSize = await client.size(input.zipPath);
        if (!zipSize) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zip file not found or is empty",
          });
        }

        // Check size limit
        if (zipSize > input.maxSize!) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: `Zip file size (${Math.round(zipSize / 1024 / 1024)}MB) exceeds the maximum allowed size (${Math.round(input.maxSize! / 1024 / 1024)}MB)`,
          });
        }

        // Determine extraction directory
        const zipDir = dirname(input.zipPath);
        const extractToPath = input.extractTo || zipDir;
        
        // Create temporary file paths
        tempZipPath = createTempFilePath("zip");
        tempExtractPath = join(tmpdir(), `ftp-extract-${Date.now()}-${Math.random().toString(36).substring(7)}`);
        mkdirSync(tempExtractPath, { recursive: true });

        console.log(`Downloading zip file: ${input.zipPath} to ${tempZipPath}`);
        
        // Download zip file with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await downloadWithRetry(client, input.credentials, tempZipPath, input.zipPath, 1);
            break;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            
            if (isRetryableTransferError(error)) {
              await reconnectFtpClient(client, input.credentials);
            }
          }
        }

        console.log(`Extracting zip file: ${tempZipPath} to ${tempExtractPath}`);
        
        // Extract zip file using adm-zip
        const zip = new AdmZip(tempZipPath);
        const zipEntries = zip.getEntries();
        
        if (zipEntries.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Zip file is empty",
          });
        }

        // Extract all entries
        zip.extractAllTo(tempExtractPath, true); // true = overwrite existing files
        
        console.log(`Extracted ${zipEntries.length} entries`);

        // Upload extracted files to FTP
        const uploadedFiles: string[] = [];
        const failedFiles: string[] = [];

        // Helper function to recursively upload files
        const uploadFileRecursive = async (localPath: string, remoteBasePath: string) => {
          const fs = require('fs');
          const stats = statSync(localPath);
          
          if (stats.isDirectory()) {
            // Create directory on FTP
            if (!tempExtractPath) {
              throw new Error("Temporary extract path is not set");
            }
            const relativePath = localPath.replace(tempExtractPath, '').replace(/\\/g, '/');
            const remoteDirPath = extractToPath === '/' 
              ? `/${relativePath}` 
              : `${extractToPath}${relativePath}`;
            
            try {
              // Try to create directory (might already exist)
              await client.ensureDir(remoteDirPath);
            } catch (error) {
              // Directory might already exist, continue
              console.log(`Directory might already exist: ${remoteDirPath}`);
            }
            
            // Recursively process directory contents
            const entries = fs.readdirSync(localPath);
            for (const entry of entries) {
              await uploadFileRecursive(join(localPath, entry), remoteBasePath);
            }
          } else if (stats.isFile()) {
            // Upload file
            if (!tempExtractPath) {
              throw new Error("Temporary extract path is not set");
            }
            const relativePath = localPath.replace(tempExtractPath, '').replace(/\\/g, '/');
            const remoteFilePath = extractToPath === '/' 
              ? `/${relativePath}` 
              : `${extractToPath}${relativePath}`;
            
            try {
              // Check if file exists and overwrite option
              if (!input.overwrite) {
                try {
                  const existingSize = await client.size(remoteFilePath);
                  if (existingSize !== undefined) {
                    // File exists, skip
                    console.log(`File already exists, skipping: ${remoteFilePath}`);
                    failedFiles.push(remoteFilePath);
                    return;
                  }
                } catch {
                  // File doesn't exist, continue with upload
                }
              }
              
              await uploadWithRetry(client, input.credentials, localPath, remoteFilePath);

              uploadedFiles.push(remoteFilePath);
              console.log(`Uploaded: ${remoteFilePath}`);
            } catch (error) {
              console.error(`Failed to upload file ${remoteFilePath}:`, error);
              failedFiles.push(remoteFilePath);
            }
          }
        };

        // Upload all extracted files
        const fs = require('fs');
        const entries = fs.readdirSync(tempExtractPath);
        for (const entry of entries) {
          await uploadFileRecursive(join(tempExtractPath, entry), extractToPath);
        }

        // Cleanup temp files
        cleanupTempFile(tempZipPath);
        cleanupTempDirectory(tempExtractPath);

        return {
          success: true,
          extractedCount: uploadedFiles.length,
          failedCount: failedFiles.length,
          files: uploadedFiles,
          failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
          message: `Successfully extracted ${uploadedFiles.length} file(s)${failedFiles.length > 0 ? `, ${failedFiles.length} file(s) failed` : ''}`,
        };
        
      } catch (error) {
        // Cleanup temp files on error
        if (tempZipPath) {
          cleanupTempFile(tempZipPath);
        }
        if (tempExtractPath) {
          cleanupTempDirectory(tempExtractPath);
        }
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw ftpUserError(error);
      } finally {
        client.close();
      }
    }),
});

// Helper function to cleanup temporary directory
function cleanupTempDirectory(dirPath: string) {
  try {
    if (existsSync(dirPath)) {
      const fs = require('fs');
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to cleanup temp directory ${dirPath}:`, error);
  }
}
