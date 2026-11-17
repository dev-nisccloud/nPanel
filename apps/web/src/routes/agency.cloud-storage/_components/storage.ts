import type { FileManagerItem } from "@/components/hosting/file-manager-schema";

/** Sample Cloud Storage. Bytes stay in the browser until a storage service is connected. */
export type StorageNode = FileManagerItem & {
  note?: string;
};

export const STORAGE_QUOTA_BYTES = 100 * 1024 ** 3;

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

const TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "json", "log"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"]);

function file(
  id: string,
  path: string,
  size: number,
  modified: string,
  note?: string,
): StorageNode {
  const name = path.split("/").pop() ?? path;
  const extension = extensionOf(name);
  return {
    id,
    name,
    type: "file",
    size,
    modified,
    permissions: "644",
    path,
    extension,
    note,
  };
}

function folder(id: string, path: string, modified: string): StorageNode {
  const name = path.split("/").pop() ?? path;
  return {
    id,
    name,
    type: "folder",
    modified,
    permissions: "755",
    path,
  };
}

export const SEED_STORAGE: StorageNode[] = [
  folder("brand", "/Brand", "2026-10-02T08:12:00.000Z"),
  folder("brand-logos", "/Brand/Logos", "2026-10-04T11:40:00.000Z"),
  file("nisc-mark", "/Brand/Logos/nisc-mark.svg", 12 * KB, "2026-10-04T11:40:00.000Z"),
  file("wordmark", "/Brand/Logos/wordmark.png", 820 * KB, "2026-10-18T15:05:00.000Z"),
  file(
    "brand-guidelines",
    "/Brand/brand-guidelines.pdf",
    2.4 * MB,
    "2026-10-21T09:18:00.000Z",
  ),
  folder("clients", "/Clients", "2026-11-02T07:55:00.000Z"),
  folder("acme", "/Clients/Acme", "2026-11-08T13:22:00.000Z"),
  file(
    "proposal",
    "/Clients/Acme/proposal.pdf",
    1.8 * MB,
    "2026-11-08T13:22:00.000Z",
    "Proposal for Acme's site move onto Nisc Cloud.",
  ),
  file("invoice-1042", "/Clients/Acme/invoice-1042.pdf", 240 * KB, "2026-11-11T16:48:00.000Z"),
  folder("northwind", "/Clients/Northwind", "2026-11-09T10:02:00.000Z"),
  file("brief", "/Clients/Northwind/brief.docx", 96 * KB, "2026-11-09T10:02:00.000Z"),
  folder("media", "/Media", "2026-11-14T18:30:00.000Z"),
  file("hero", "/Media/hero-homepage.jpg", 4.2 * MB, "2026-11-14T18:30:00.000Z"),
  file("reel", "/Media/product-reel.mp4", 1.72 * GB, "2026-11-15T12:10:00.000Z"),
  file("voiceover", "/Media/voiceover.mp3", 8.4 * MB, "2026-11-15T12:16:00.000Z"),
  folder("archive", "/Archive", "2026-11-01T06:00:00.000Z"),
  file("site-zip", "/Archive/site-2026-11-01.zip", 640 * MB, "2026-11-01T06:12:00.000Z"),
  file("client-archive", "/Archive/client-archive-2026.tar", 24 * GB, "2026-11-01T06:40:00.000Z"),
  file(
    "readme",
    "/readme.txt",
    1.1 * KB,
    "2026-11-16T08:00:00.000Z",
    "Agency files for brand, clients, and media.",
  ),
  file(
    "notes",
    "/meeting-notes.md",
    4.2 * KB,
    "2026-11-16T14:35:00.000Z",
    "Monday\n- Move campaign stills into Media.\n- Send Acme the November invoice.\n- Keep client files in their own folder.",
  ),
];

export function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  const parts = path.split("/").filter((part) => part && part !== ".");
  return parts.length ? `/${parts.join("/")}` : "/";
}

export function parentPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "/") return "/";
  const parts = normalized.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}

export function joinPath(directory: string, name: string): string {
  const dir = normalizePath(directory);
  return dir === "/" ? `/${name}` : `${dir}/${name}`;
}

export function extensionOf(name: string): string | undefined {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return undefined;
  return name.slice(dot + 1).toLowerCase();
}

export function isTextFile(item: StorageNode): boolean {
  return item.type === "file" && TEXT_EXTENSIONS.has(item.extension ?? "");
}

export function isImageFile(item: StorageNode): boolean {
  return item.type === "file" && IMAGE_EXTENSIONS.has(item.extension ?? "");
}

/** True when `path` is the folder or something inside it. Root contains everything. */
export function isInside(path: string, folderPath: string): boolean {
  const folder = normalizePath(folderPath);
  const target = normalizePath(path);
  if (folder === "/") return true;
  return target === folder || target.startsWith(`${folder}/`);
}

export function folderExists(items: StorageNode[], path: string): boolean {
  const normalized = normalizePath(path);
  if (normalized === "/") return true;
  return items.some((item) => item.type === "folder" && item.path === normalized);
}

export function childrenOf(items: StorageNode[], directory: string): StorageNode[] {
  const dir = normalizePath(directory);
  return items.filter((item) => parentPath(item.path) === dir);
}

export function breadcrumbs(path: string): { name: string; path: string }[] {
  const normalized = normalizePath(path);
  const crumbs = [{ name: "All files", path: "/" }];
  if (normalized === "/") return crumbs;
  let built = "";
  for (const segment of normalized.split("/").filter(Boolean)) {
    built += `/${segment}`;
    crumbs.push({ name: segment, path: built });
  }
  return crumbs;
}

export function usedBytes(items: StorageNode[]): number {
  return items.reduce((sum, item) => sum + (item.type === "file" ? item.size ?? 0 : 0), 0);
}

export function formatBytes(bytes?: number): string {
  if (bytes == null) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const digits = index === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[index]}`;
}

export type StorageSort = "name" | "modified" | "size";

export function sortStorageItems(items: StorageNode[], sort: StorageSort): StorageNode[] {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    if (sort === "size") return (b.size ?? 0) - (a.size ?? 0);
    if (sort === "modified") {
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

const INVALID_NAME = /[\\/:*?"<>|]/;

export function validateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter a name.");
  if (trimmed === "." || trimmed === "..") throw new Error("That name is not allowed.");
  if (INVALID_NAME.test(trimmed)) throw new Error('Names cannot include \\ / : * ? " < > |');
  if (trimmed.length > 255) throw new Error("Use a name under 255 characters.");
  return trimmed;
}

function replacePrefix(path: string, from: string, to: string): string {
  if (path === from) return to;
  if (path.startsWith(`${from}/`)) return `${to}${path.slice(from.length)}`;
  return path;
}

function collectSubtree(items: StorageNode[], root: StorageNode): StorageNode[] {
  if (root.type === "file") return [root];
  return items.filter((item) => item.path === root.path || item.path.startsWith(`${root.path}/`));
}

/** Selected items, skipping anything that already sits inside another selected folder. */
export function topLevelSelection(items: StorageNode[], ids: string[]): StorageNode[] {
  const selected = items.filter((item) => ids.includes(item.id));
  return selected.filter(
    (item) =>
      !selected.some(
        (other) =>
          other.type === "folder" &&
          other.id !== item.id &&
          item.path.startsWith(`${other.path}/`),
      ),
  );
}

function takenNames(items: StorageNode[], directory: string, ignoreIds: Set<string>): Set<string> {
  return new Set(
    childrenOf(items, directory)
      .filter((item) => !ignoreIds.has(item.id))
      .map((item) => item.name.toLowerCase()),
  );
}

function uniqueName(taken: Set<string>, name: string, isFolder: boolean, style: "copy" | "upload"): string {
  if (!taken.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf(".");
  const hasExt = !isFolder && dot > 0;
  const base = hasExt ? name.slice(0, dot) : name;
  const ext = hasExt ? name.slice(dot) : "";
  let index = style === "upload" ? 2 : 1;
  while (index < 1000) {
    const candidate =
      style === "upload"
        ? `${base} (${index})${ext}`
        : index === 1
          ? `${base} copy${ext}`
          : `${base} copy ${index}${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
    index += 1;
  }
  throw new Error("No available name.");
}

function assertQuota(bytes: number) {
  if (bytes > STORAGE_QUOTA_BYTES) {
    throw new Error("That would pass the 100 GB included with this storage.");
  }
}

function assertFolder(items: StorageNode[], path: string) {
  if (!folderExists(items, path)) throw new Error("That folder is not available.");
}

export function createFolder(items: StorageNode[], directory: string, rawName: string): StorageNode[] {
  const dir = normalizePath(directory);
  assertFolder(items, dir);
  const name = validateName(rawName);
  const taken = takenNames(items, dir, new Set());
  if (taken.has(name.toLowerCase())) throw new Error(`"${name}" is already in this folder.`);
  const now = new Date().toISOString();
  return [
    ...items,
    {
      id: crypto.randomUUID(),
      name,
      type: "folder",
      modified: now,
      permissions: "755",
      path: joinPath(dir, name),
    },
  ];
}

export function renameItem(items: StorageNode[], id: string, rawName: string): StorageNode[] {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new Error("That item is no longer here.");
  const name = validateName(rawName);
  if (name === item.name) return items;
  const directory = parentPath(item.path);
  const taken = takenNames(items, directory, new Set([item.id]));
  if (taken.has(name.toLowerCase())) throw new Error(`"${name}" is already in this folder.`);
  const target = joinPath(directory, name);
  const now = new Date().toISOString();
  return items.map((node) => {
    const inSubtree =
      node.path === item.path || (item.type === "folder" && node.path.startsWith(`${item.path}/`));
    if (!inSubtree) return node;
    return {
      ...node,
      name: node.id === item.id ? name : node.name,
      path: replacePrefix(node.path, item.path, target),
      modified: node.id === item.id ? now : node.modified,
    };
  });
}

export function moveItems(items: StorageNode[], ids: string[], destination: string): StorageNode[] {
  const dest = normalizePath(destination);
  assertFolder(items, dest);
  const moving = topLevelSelection(items, ids);
  if (moving.length === 0) throw new Error("No files or folders selected.");
  for (const item of moving) {
    if (item.type === "folder" && isInside(dest, item.path)) {
      throw new Error(`Cannot move "${item.name}" into itself.`);
    }
  }
  const movingIds = new Set(moving.map((item) => item.id));
  const taken = takenNames(items, dest, movingIds);
  for (const item of moving) {
    if (parentPath(item.path) === dest) continue;
    if (taken.has(item.name.toLowerCase())) {
      throw new Error(`"${item.name}" is already in that folder.`);
    }
    taken.add(item.name.toLowerCase());
  }
  const now = new Date().toISOString();
  let next = items;
  for (const item of moving) {
    if (parentPath(item.path) === dest) continue;
    const target = joinPath(dest, item.name);
    next = next.map((node) => {
      const inSubtree =
        node.path === item.path || (item.type === "folder" && node.path.startsWith(`${item.path}/`));
      if (!inSubtree) return node;
      return {
        ...node,
        path: replacePrefix(node.path, item.path, target),
        modified: node.id === item.id ? now : node.modified,
      };
    });
  }
  return next;
}

export function copyItems(
  items: StorageNode[],
  ids: string[],
  destination: string,
): { items: StorageNode[]; idMap: Map<string, string> } {
  const dest = normalizePath(destination);
  assertFolder(items, dest);
  const copying = topLevelSelection(items, ids);
  if (copying.length === 0) throw new Error("No files or folders selected.");
  for (const item of copying) {
    if (item.type === "folder" && isInside(dest, item.path)) {
      throw new Error(`Cannot copy "${item.name}" into itself.`);
    }
  }
  const taken = takenNames(items, dest, new Set());
  const clones: StorageNode[] = [];
  const idMap = new Map<string, string>();
  const now = new Date().toISOString();
  for (const item of copying) {
    const name = uniqueName(taken, item.name, item.type === "folder", "copy");
    taken.add(name.toLowerCase());
    const target = joinPath(dest, name);
    for (const node of collectSubtree(items, item)) {
      const id = crypto.randomUUID();
      idMap.set(node.id, id);
      clones.push({
        ...node,
        id,
        name: node.id === item.id ? name : node.name,
        path: replacePrefix(node.path, item.path, target),
        modified: now,
      });
    }
  }
  const next = [...items, ...clones];
  assertQuota(usedBytes(next));
  return { items: next, idMap };
}

export function deleteItems(items: StorageNode[], ids: string[]): StorageNode[] {
  const removing = topLevelSelection(items, ids);
  if (removing.length === 0) throw new Error("No files or folders selected.");
  const removeIds = new Set<string>();
  for (const item of removing) {
    for (const node of collectSubtree(items, item)) removeIds.add(node.id);
  }
  return items.filter((item) => !removeIds.has(item.id));
}

export type UploadInput = {
  name: string;
  size: number;
  mimeType?: string;
};

export function addFiles(
  items: StorageNode[],
  directory: string,
  files: UploadInput[],
): { items: StorageNode[]; created: StorageNode[] } {
  const dir = normalizePath(directory);
  assertFolder(items, dir);
  if (files.length === 0) throw new Error("No files to add.");
  const taken = takenNames(items, dir, new Set());
  const now = new Date().toISOString();
  const created: StorageNode[] = [];
  for (const upload of files) {
    const safe = validateName(upload.name);
    const name = uniqueName(taken, safe, false, "upload");
    taken.add(name.toLowerCase());
    created.push({
      id: crypto.randomUUID(),
      name,
      type: "file",
      size: Math.max(0, upload.size),
      modified: now,
      permissions: "644",
      path: joinPath(dir, name),
      extension: extensionOf(name),
      mimeType: upload.mimeType,
    });
  }
  const next = [...items, ...created];
  assertQuota(usedBytes(next));
  return { items: next, created };
}
