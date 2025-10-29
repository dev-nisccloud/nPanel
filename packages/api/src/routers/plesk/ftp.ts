import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Client, FileInfo } from "basic-ftp";
import archiver from "archiver";
import { createWriteStream, createReadStream, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { protectedProcedure, router } from "../../trpc";

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
  path: z.string().min(1, "Path is required"),
});

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
    console.error("FTP connection failed:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to connect to FTP server: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
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

// Helper function to recursively list all files in a directory
async function getAllFilesRecursively(client: Client, dirPath: string): Promise<any[]> {
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
        const subFiles = await getAllFilesRecursively(client, fullPath);
        allFiles.push(...subFiles);
      } else {
        // Only add files, not directories
        console.log(`Adding file: ${fullPath}`);
        allFiles.push(fileInfo);
      }
    }
  } catch (error) {
    console.error(`Error listing directory ${dirPath}:`, error);
    // Continue with other directories even if one fails
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
  testConnection: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to test FTP connection: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // List files and directories
  list: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Get current working directory
  pwd: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get current directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Change directory
  cd: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to change directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Get file information
  getFileInfo: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get file info: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Upload file (server-side)
  upload: protectedProcedure
    .input(uploadSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.uploadFrom(input.localPath, input.remotePath);
        return {
          success: true,
          message: `File uploaded successfully to ${input.remotePath}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Upload file from browser (base64 data)
  uploadFile: protectedProcedure
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
        await client.uploadFrom(tempFilePath, remotePath);
        
        return {
          success: true,
          message: `File ${input.fileName} uploaded successfully to ${remotePath}`,
          remotePath,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        // Cleanup temp file
        if (tempFilePath) {
          cleanupTempFile(tempFilePath);
        }
        client.close();
      }
    }),

  // Download file
  download: protectedProcedure
    .input(downloadSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.downloadTo(input.localPath, input.remotePath);
        return {
          success: true,
          message: `File downloaded successfully to ${input.localPath}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Rename file or directory
  rename: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to rename: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Delete file
  deleteFile: protectedProcedure
    .input(deleteSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.remove(input.path);
        return {
          success: true,
          message: `File ${input.path} deleted successfully`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Delete directory
  deleteDirectory: protectedProcedure
    .input(deleteSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      
      try {
        await client.removeDir(input.path);
        return {
          success: true,
          message: `Directory ${input.path} deleted successfully`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Create directory
  createDirectory: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),


  // Get FTP server features
  getFeatures: protectedProcedure
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get FTP features: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Download single file
  downloadFile: protectedProcedure
    .input(downloadFileSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      let tempFilePath: string | null = null;
      
      try {
        console.log(`Downloading file: ${input.remotePath}`);
        
        // Create temporary file path
        tempFilePath = createTempFilePath();
        
        // Download file with retry logic
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await client.downloadTo(tempFilePath, input.remotePath);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              throw error; // Re-throw if max retries reached
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            
            // Reconnect if connection was lost
            if (error instanceof Error && error.message.includes('connection')) {
              client.close();
              await client.access({
                host: input.credentials.host,
                port: input.credentials.port,
                user: input.credentials.user,
                password: input.credentials.password,
                secure: input.credentials.secure,
              });
            }
          }
        }
        
        // Read the downloaded file
        const fileBuffer = createReadStream(tempFilePath);
        const chunks: Buffer[] = [];
        
        return new Promise<{ success: boolean; data: Buffer; filename: string }>((resolve, reject) => {
          fileBuffer.on('data', (chunk: string | Buffer) => {
            if (Buffer.isBuffer(chunk)) {
              chunks.push(chunk);
            } else {
              chunks.push(Buffer.from(chunk));
            }
          });
          fileBuffer.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const filename = input.remotePath.split('/').pop() || 'download';
            
            // Cleanup temp file
            cleanupTempFile(tempFilePath!);
            
            resolve({
              success: true,
              data: buffer,
              filename,
            });
          });
          fileBuffer.on('error', (error) => {
            cleanupTempFile(tempFilePath!);
            reject(new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to read downloaded file: ${error.message}`,
            }));
          });
        });
        
      } catch (error) {
        // Cleanup temp file on error
        if (tempFilePath) {
          cleanupTempFile(tempFilePath);
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),

  // Download folder as zip
  downloadFolder: protectedProcedure
    .input(downloadFolderSchema)
    .mutation(async ({ input }) => {
      const client = await createFtpClient(input.credentials);
      let tempZipPath: string | null = null;
      
      try {
        // Get all files recursively
        console.log(`Starting folder download for: ${input.remotePath}`);
        const allFiles = await getAllFilesRecursively(client, input.remotePath);
        console.log(`Found ${allFiles.length} files in folder:`, allFiles.map(f => f.path));
        
        if (allFiles.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Folder is empty or does not exist",
          });
        }
        
        // Check total folder size limit (500MB)
        const maxFolderSize = 500 * 1024 * 1024; // 500MB
        const totalSize = allFiles.reduce((sum, file) => sum + (file.size || 0), 0);
        
        if (totalSize > maxFolderSize) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: `Folder too large (${Math.round(totalSize / 1024 / 1024)}MB). Maximum allowed size is 500MB.`,
          });
        }
        
        console.log(`Folder total size: ${Math.round(totalSize / 1024)}KB`);
        
        // Create temporary zip file
        tempZipPath = createTempFilePath("zip");
        const output = createWriteStream(tempZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        // Set up archive
        archive.pipe(output);
        
        // Track progress
        let processedFiles = 0;
        
        // Add files to archive
        const tempFiles: string[] = [];
        
        for (const file of allFiles) {
          try {
            console.log(`Processing file: ${file.path}`);
            
            // Create temporary file for each file
            const tempFilePath = createTempFilePath();
            tempFiles.push(tempFilePath);
            console.log(`Created temp file: ${tempFilePath}`);
            
            // Download file with retry logic
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
              try {
                console.log(`Downloading file ${file.path} to ${tempFilePath} (attempt ${retryCount + 1})`);
                await client.downloadTo(tempFilePath, file.path);
                console.log(`Successfully downloaded file: ${file.path}`);
                break;
              } catch (error) {
                retryCount++;
                console.error(`Download attempt ${retryCount} failed for ${file.path}:`, error);
                if (retryCount >= maxRetries) {
                  throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                
                if (error instanceof Error && error.message.includes('connection')) {
                  client.close();
                  await client.access({
                    host: input.credentials.host,
                    port: input.credentials.port,
                    user: input.credentials.user,
                    password: input.credentials.password,
                    secure: input.credentials.secure,
                  });
                }
              }
            }
            
            // Calculate relative path for archive
            const relativePath = file.path.startsWith(input.remotePath) 
              ? file.path.substring(input.remotePath.length + 1)
              : file.path.substring(1); // Remove leading slash if not starting with remotePath
            
            console.log(`DEBUG: File path: ${file.path}, Remote path: ${input.remotePath}, Relative path: ${relativePath}`);
            
            console.log(`Adding file to archive: ${relativePath} (from ${tempFilePath})`);
            
            // Add file to archive
            archive.file(tempFilePath, { name: relativePath });
            console.log(`File added to archive: ${relativePath}`);
            
            // Check if temp file exists and has content
            const fs = require('fs');
            if (fs.existsSync(tempFilePath)) {
              const stats = fs.statSync(tempFilePath);
              console.log(`DEBUG: Temp file ${tempFilePath} exists, size: ${stats.size} bytes`);
            } else {
              console.log(`DEBUG: Temp file ${tempFilePath} does not exist!`);
            }
            
            processedFiles++;
            console.log(`Successfully processed file ${processedFiles}/${allFiles.length}: ${file.path}`);
            
          } catch (error) {
            console.error(`Failed to process file ${file.path}:`, error);
            // Continue with other files
          }
        }
        
        // Cleanup all temp files after archive is finalized
        console.log(`Cleaning up ${tempFiles.length} temporary files`);
        tempFiles.forEach(cleanupTempFile);
        
        // Finalize archive
        console.log(`Finalizing archive with ${processedFiles} files processed`);
        await archive.finalize();
        console.log(`Archive finalized successfully`);
        
        // Log archive entries for debugging
        console.log(`DEBUG: Archive entries:`, archive.pointer());
        
        // Wait for zip to be written
        console.log(`Waiting for zip file to be written to ${tempZipPath}`);
        await new Promise<void>((resolve, reject) => {
          output.on('close', () => {
            console.log(`Zip file written successfully`);
            resolve();
          });
          output.on('error', reject);
        });
        
        // Read the zip file
        console.log(`Reading zip file from ${tempZipPath}`);
        const zipBuffer = createReadStream(tempZipPath);
        const chunks: Buffer[] = [];
        
        return new Promise<{ success: boolean; data: Buffer; filename: string }>((resolve, reject) => {
          zipBuffer.on('data', (chunk: string | Buffer) => {
            if (Buffer.isBuffer(chunk)) {
              chunks.push(chunk);
            } else {
              chunks.push(Buffer.from(chunk));
            }
          });
          zipBuffer.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const filename = `${input.folderName}.zip`;
            
            console.log(`Zip file read successfully, size: ${buffer.length} bytes`);
            
            // Cleanup temp zip file
            cleanupTempFile(tempZipPath!);
            
            resolve({
              success: true,
              data: buffer,
              filename,
            });
          });
          zipBuffer.on('error', (error) => {
            cleanupTempFile(tempZipPath!);
            reject(new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to read zip file: ${error.message}`,
            }));
          });
        });
        
      } catch (error) {
        // Cleanup temp zip file on error
        if (tempZipPath) {
          cleanupTempFile(tempZipPath);
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to download folder: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        client.close();
      }
    }),
});
