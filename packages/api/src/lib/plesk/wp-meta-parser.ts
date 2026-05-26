/**
 * Normalizes WP Toolkit "meta/value" API shapes into plain objects for the app layer.
 */

export type WpTaskPayload = {
  id?: number;
  code?: string;
  title?: string;
  status?: string;
  progress?: number;
  steps?: Array<{
    code?: string;
    title?: string;
    status?: string;
    progress?: number;
    hint?: string;
  }>;
  publicParams?: Record<string, unknown>;
  errors?: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** WP Toolkit often wraps scalars as `{ value, meta }`. */
export function readMetaScalar(field: unknown): string | number | boolean | undefined {
  if (field == null) return undefined;
  if (typeof field === "string" || typeof field === "number" || typeof field === "boolean") {
    return field;
  }
  const rec = asRecord(field);
  if (!rec || !("value" in rec)) return undefined;
  const v = rec.value;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  return undefined;
}

/** Extract string list from meta value arrays like [{ value: "gif", meta: {} }, ...] */
export function parseMetaStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim());
      continue;
    }
    const rec = asRecord(item);
    const v = rec?.value;
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  }
  return out;
}

export function parseHotlinkSettingsMeta(data: unknown): {
  domains: string[];
  fileExtensions: string[];
  defaultDomains: string[];
  defaultFileExtensions: string[];
} {
  const root = asRecord(data);
  const value = asRecord(root?.value) ?? root;

  const domainsBlock = asRecord(value?.domains);
  const extensionsBlock = asRecord(value?.fileExtensions);
  const domainsMeta = asRecord(domainsBlock?.meta);
  const extensionsMeta = asRecord(extensionsBlock?.meta);

  return {
    domains: parseMetaStringList(domainsBlock?.value),
    fileExtensions: parseMetaStringList(extensionsBlock?.value),
    defaultDomains: parseMetaStringList(domainsMeta?.defaults),
    defaultFileExtensions: parseMetaStringList(extensionsMeta?.defaults),
  };
}

/** Flat hotlink settings response (PUT/DELETE) */
export function parseHotlinkSettingsFlat(data: unknown): {
  domains: string[];
  fileExtensions: string[];
} {
  const root = asRecord(data);
  if (!root) return { domains: [], fileExtensions: [] };

  let extensions: string[] = [];
  const rawExt = root.fileExtensions;
  if (Array.isArray(rawExt)) {
    for (const entry of rawExt) {
      if (typeof entry === "string") extensions.push(entry);
      else if (Array.isArray(entry)) extensions.push(...entry.filter((x) => typeof x === "string"));
    }
  }

  const domains = Array.isArray(root.domains)
    ? root.domains.filter((d): d is string => typeof d === "string")
    : [];

  return { domains, fileExtensions: extensions };
}

export function extractTaskFromResponse(data: unknown): WpTaskPayload | null {
  const root = asRecord(data);
  if (!root) return null;

  const dataBlock = asRecord(root.data);
  const task =
    asRecord(root.task) ??
    asRecord(dataBlock?.task) ??
    asRecord(dataBlock?.value) ??
    (root.id != null || root.code ? root : null);

  if (!task) return null;

  const statusRaw = readMetaScalar(task.status);
  const progressRaw = readMetaScalar(task.progress);
  const stepsSource = Array.isArray(task.steps) ? task.steps : undefined;

  return {
    id:
      typeof task.id === "number"
        ? task.id
        : typeof readMetaScalar(task.id) === "number"
          ? (readMetaScalar(task.id) as number)
          : undefined,
    code:
      typeof task.code === "string"
        ? task.code
        : typeof readMetaScalar(task.code) === "string"
          ? (readMetaScalar(task.code) as string)
          : undefined,
    title:
      typeof task.title === "string"
        ? task.title
        : typeof readMetaScalar(task.title) === "string"
          ? (readMetaScalar(task.title) as string)
          : undefined,
    status: typeof statusRaw === "string" ? statusRaw : undefined,
    progress: typeof progressRaw === "number" ? progressRaw : undefined,
    steps: stepsSource
      ? stepsSource.map((s) => {
          const step = asRecord(s);
          if (!step) return {};
          return {
            code:
              typeof readMetaScalar(step.code) === "string"
                ? (readMetaScalar(step.code) as string)
                : undefined,
            title:
              typeof readMetaScalar(step.title) === "string"
                ? (readMetaScalar(step.title) as string)
                : undefined,
            status:
              typeof readMetaScalar(step.status) === "string"
                ? (readMetaScalar(step.status) as string)
                : undefined,
            progress:
              typeof readMetaScalar(step.progress) === "number"
                ? (readMetaScalar(step.progress) as number)
                : undefined,
            hint:
              typeof readMetaScalar(step.hint) === "string"
                ? (readMetaScalar(step.hint) as string)
                : undefined,
          };
        })
      : undefined,
    publicParams: asRecord(task.publicParams) ?? undefined,
    errors: Array.isArray(task.errors)
      ? task.errors.filter((e): e is string => typeof e === "string")
      : undefined,
  };
}

const WP_TASK_PATH_REGEX = /^\/v1\/background-tasks\/[a-zA-Z0-9._-]+\/\d+$/;

/** Normalize Plesk task URLs to `/v1/background-tasks/{code}/{id}` for REST requests. */
export function normalizeWpToolkitTaskUrl(taskUrl: string): string {
  let path = taskUrl.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    path = new URL(path).pathname;
  }
  for (const prefix of ["/api/modules/wp-toolkit", "/modules/wp-toolkit"]) {
    if (path.startsWith(prefix)) {
      path = path.slice(prefix.length);
      break;
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/$/, "");
  if (!WP_TASK_PATH_REGEX.test(path)) {
    throw new Error(`Invalid background task reference: ${path}`);
  }
  return path;
}

export function tryNormalizeWpToolkitTaskUrl(taskUrl: string): string | null {
  try {
    return normalizeWpToolkitTaskUrl(taskUrl);
  } catch {
    return null;
  }
}

export type ParsedIntegrityTask = {
  code: string;
  title?: string;
  status?: string;
};

export type ParsedIntegrityInfo = {
  status?: string;
  available?: boolean;
  tasks: ParsedIntegrityTask[];
  message?: string;
};

export function parseIntegrityInfo(data: unknown): ParsedIntegrityInfo {
  const root = asRecord(data);
  const payload = asRecord(root?.data) ?? root;
  const integrity = asRecord(payload?.integrity) ?? payload;

  const tasks: ParsedIntegrityTask[] = [];
  const tasksRaw = integrity?.tasks ?? payload?.tasks;

  if (tasksRaw && typeof tasksRaw === "object" && !Array.isArray(tasksRaw)) {
    for (const [code, entry] of Object.entries(tasksRaw)) {
      const task = asRecord(entry);
      if (!task) continue;
      tasks.push({
        code,
        title: typeof task.title === "string" ? task.title : code,
        status: typeof task.status === "string" ? task.status : undefined,
      });
    }
  } else if (Array.isArray(tasksRaw)) {
    tasksRaw.forEach((entry, index) => {
      const task = asRecord(entry);
      if (!task) return;
      tasks.push({
        code: typeof task.code === "string" ? task.code : `task-${index}`,
        title: typeof task.title === "string" ? task.title : undefined,
        status: typeof task.status === "string" ? task.status : undefined,
      });
    });
  }

  const statusField = integrity?.status ?? payload?.status;
  const status =
    typeof statusField === "string"
      ? statusField
      : typeof statusField === "boolean"
        ? statusField
          ? "ok"
          : "issues"
        : undefined;

  return {
    status,
    available:
      typeof integrity?.available === "boolean"
        ? integrity.available
        : typeof payload?.available === "boolean"
          ? payload.available
          : undefined,
    tasks,
    message:
      typeof integrity?.message === "string"
        ? integrity.message
        : typeof payload?.message === "string"
          ? payload.message
          : undefined,
  };
}

/** Parse task URL like /v1/background-tasks/mass-check-updates/1 → id segment */
export type ParsedBackupItem = {
  fileName: string;
  fileSize?: number;
  createdAt?: string;
  absoluteFilePath?: string;
};

function readMetaField(field: unknown): { value?: string | number; meta?: Record<string, unknown> } {
  const rec = asRecord(field);
  if (!rec) return {};
  return {
    value: typeof rec.value === "string" || typeof rec.value === "number" ? rec.value : undefined,
    meta: asRecord(rec.meta) ?? undefined,
  };
}

function backupItemFromRecord(val: Record<string, unknown>): ParsedBackupItem | null {
  const fileNameField = readMetaField(val.fileName);
  const fileSizeField = readMetaField(val.fileSize);
  const createdAtField = readMetaField(val.createdAt);
  const pathField = readMetaField(val.absoluteFilePath);

  const name =
    typeof fileNameField.value === "string"
      ? fileNameField.value
      : typeof val.fileName === "string"
        ? val.fileName
        : undefined;

  if (!name) return null;

  return {
    fileName: name,
    fileSize:
      typeof fileSizeField.value === "number"
        ? fileSizeField.value
        : typeof val.fileSize === "number"
          ? val.fileSize
          : undefined,
    createdAt:
      typeof createdAtField.value === "string"
        ? createdAtField.value
        : typeof val.createdAt === "string"
          ? val.createdAt
          : undefined,
    absoluteFilePath:
      typeof pathField.value === "string"
        ? pathField.value
        : typeof val.absoluteFilePath === "string"
          ? val.absoluteFilePath
          : undefined,
  };
}

export function parseBackupsMetaList(data: unknown): {
  items: ParsedBackupItem[];
  fileManagerUrl?: string;
  limit?: number;
  dirName?: string;
} {
  const root = asRecord(data);
  const payload = root?.data !== undefined ? asRecord(root.data) ?? root : root;
  const meta = asRecord(payload?.meta);
  const entries = Array.isArray(payload?.value) ? payload.value : [];

  const items: ParsedBackupItem[] = [];
  for (const entry of entries) {
    const block = asRecord(entry);
    if (!block) continue;
    const val = asRecord(block.value) ?? block;
    const parsed = backupItemFromRecord(val);
    if (parsed) items.push(parsed);
  }

  return {
    items,
    fileManagerUrl: typeof meta?.fileManagerUrl === "string" ? meta.fileManagerUrl : undefined,
    limit: typeof meta?.limit === "number" ? meta.limit : undefined,
    dirName: typeof meta?.dirName === "string" ? meta.dirName : undefined,
  };
}

/** Normalize flat backup array from GET /backups */
export function parseBackupsFlatList(data: unknown): ParsedBackupItem[] {
  const root = asRecord(data);
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(root?.data)
      ? root.data
      : [];

  return arr
    .map((row) => {
      const r = asRecord(row);
      if (!r) return null;
      return backupItemFromRecord(r);
    })
    .filter((x): x is ParsedBackupItem => x !== null);
}

export function parseWpCronMeta(data: unknown): {
  available: boolean;
  status: boolean;
  taskReplacementStatus: boolean;
  managementUri?: string;
} {
  const root = asRecord(data);
  const value = asRecord(root?.value) ?? root;

  const available = asRecord(value?.available);
  const status = asRecord(value?.status);
  const taskReplacement = asRecord(value?.taskReplacementStatus);
  const taskMeta = asRecord(taskReplacement?.meta);

  return {
    available: Boolean(available?.value),
    status: Boolean(status?.value),
    taskReplacementStatus: Boolean(taskReplacement?.value),
    managementUri:
      typeof taskMeta?.managementUri === "string" ? taskMeta.managementUri : undefined,
  };
}

export function parseBackgroundTaskPath(taskUrl: string): string | null {
  const trimmed = taskUrl.trim();
  const match = trimmed.match(/\/v1\/background-tasks\/[^/]+\/(\d+)\/?$/i);
  if (match?.[1]) return match[1];
  const simple = trimmed.match(/\/background-tasks\/(\d+)\/?$/i);
  return simple?.[1] ?? null;
}
