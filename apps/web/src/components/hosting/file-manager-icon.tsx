"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

type FileManagerIconItem = {
  type: string;
  name: string;
  extension?: string;
};

function getExtension(item: FileManagerIconItem): string {
  const fromField = item.extension?.toLowerCase().trim();
  if (fromField) return fromField;
  const dotIndex = item.name.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === item.name.length - 1) return "";
  return item.name.slice(dotIndex + 1).toLowerCase();
}

const IMAGE_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "heic",
  "heif",
  "avif",
  "tif",
  "tiff",
]);

const VIDEO_EXTS = new Set([
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "wmv",
  "flv",
  "m4v",
  "mpeg",
  "mpg",
  "3gp",
]);

const AUDIO_EXTS = new Set([
  "mp3",
  "wav",
  "ogg",
  "flac",
  "aac",
  "m4a",
  "wma",
  "aiff",
  "opus",
]);

const DOCUMENT_EXTS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "odt",
  "ods",
  "odp",
  "rtf",
  "csv",
  "pages",
  "numbers",
  "key",
  "txt",
  "md",
  "log",
  "readme",
  "license",
]);

const ARCHIVE_EXTS = new Set([
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "tgz",
  "bz2",
  "xz",
]);

const CODE_EXTS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "json",
  "xml",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "php",
  "py",
  "java",
  "cpp",
  "c",
  "h",
  "hpp",
  "go",
  "rs",
  "rb",
  "swift",
  "kt",
  "scala",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "bat",
  "cmd",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "config",
  "env",
  "gitignore",
  "dockerfile",
  "sql",
  "graphql",
  "gql",
  "vue",
  "svelte",
  "astro",
  "r",
  "m",
  "pl",
  "pm",
  "lua",
  "vim",
  "clj",
  "hs",
  "elm",
  "ex",
  "exs",
  "properties",
  "cfg",
]);

type FileManagerIconProps = {
  item: FileManagerIconItem;
  className?: string;
  size?: number;
};

export function FileManagerTypeIcon({
  item,
  className,
  size,
}: FileManagerIconProps) {
  const iconProps = {
    className: cn("text-primary", className),
    ...(size != null ? { size } : {}),
  };

  if (item.type === "folder") {
    return <Icons.Folder {...iconProps} />;
  }

  const ext = getExtension(item);

  if (IMAGE_EXTS.has(ext)) {
    return <Icons.FILE_MANAGER_IMAGE {...iconProps} />;
  }
  if (VIDEO_EXTS.has(ext)) {
    return <Icons.FILE_MANAGER_VIDEO {...iconProps} />;
  }
  if (AUDIO_EXTS.has(ext)) {
    return <Icons.FILE_MANAGER_AUDIO {...iconProps} />;
  }
  if (ARCHIVE_EXTS.has(ext)) {
    return <Icons.FILE_MANAGER_ZIP {...iconProps} />;
  }
  if (CODE_EXTS.has(ext)) {
    return <Icons.FILE_MANAGER_CODE {...iconProps} />;
  }
  if (DOCUMENT_EXTS.has(ext)) {
    return <Icons.FILE_MANAGER_DOCUMENT {...iconProps} />;
  }

  return <Icons.FILE_MANAGER_OTHER {...iconProps} />;
}
