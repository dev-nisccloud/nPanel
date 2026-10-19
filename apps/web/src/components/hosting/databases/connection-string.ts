export function generateDatabasePassword(length = 16): string {
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowers = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%^&*-_";
  const all = uppers + lowers + digits + specials;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const chars = [
    uppers[bytes[0]! % uppers.length]!,
    lowers[bytes[1]! % lowers.length]!,
    digits[bytes[2]! % digits.length]!,
    specials[bytes[3]! % specials.length]!,
  ];
  for (let i = chars.length; i < length; i++) {
    chars.push(all[bytes[i]! % all.length]!);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

export function buildDbConnectionString(opts: {
  type?: string;
  username: string;
  password?: string;
  host: string;
  port: number;
  database: string;
}): string {
  const scheme = (opts.type || "mysql").toLowerCase() === "postgresql" ? "postgresql" : "mysql";
  const user = encodeURIComponent(opts.username);
  const auth = opts.password != null && opts.password !== ""
    ? `${user}:${encodeURIComponent(opts.password)}`
    : user;
  return `${scheme}://${auth}@${opts.host}:${opts.port}/${opts.database}`;
}

export function isMysqlFamily(type?: string): boolean {
  const t = (type || "mysql").toLowerCase();
  return t === "mysql" || t === "mariadb";
}

export function formatDatabaseSize(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "Not available";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}
