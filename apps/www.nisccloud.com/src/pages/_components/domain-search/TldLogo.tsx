const TLD_LOGO_IMAGES: Record<string, string> = {
  ".ke": "/ke_tld.png",
  ".co.ke": "/co_ke_tld.png",
  ".com": "/dot_com_logo.webp",
  ".org": "/dot_org_logo.webp",
  ".net": "/dot_net_logo.webp",
  ".io": "/dot_io_logo.webp",
  ".info": "/dot_info_logo.png",
};

const DEFAULT_LOGO_SIZE = 56;

export type TldLogoVariant = "kenyan" | "openprovider";

interface TldLogoProps {
  tld: string;
  variant: TldLogoVariant;
  className?: string;
  size?: number;
}

export function TldLogo({ tld, variant, className, size = DEFAULT_LOGO_SIZE }: TldLogoProps) {
  const normalized = tld.startsWith(".") ? tld : `.${tld}`;
  const logoSrc = TLD_LOGO_IMAGES[normalized];

  if (logoSrc) {
    return (
      <div
        className={`flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <img
          src={logoSrc}
          alt={normalized}
          width={size}
          height={size}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  const withoutDot = normalized.replace(/^\./, "");
  const isLikelyRealTld = withoutDot && (normalized.includes(".") || withoutDot.length <= 4);
  const label = isLikelyRealTld ? (withoutDot.split(".")[0] ?? withoutDot) : "•";

  if (variant === "kenyan") {
    return (
      <div
        className={`flex-shrink-0 rounded-lg flex items-center justify-center shadow-inner ${className ?? ""}`}
        style={{
          width: size,
          height: size,
          background: "linear-gradient(to bottom right, #006600, #BB0000, #000000)",
        }}
        title={normalized}
        aria-hidden
      >
        <span className="text-white font-bold text-sm drop-shadow-md">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex-shrink-0 rounded-lg flex items-center justify-center shadow-inner bg-gradient-to-b from-[#38b6ff]/20 via-[#38b6ff]/10 to-[#38b6ff]/5 dark:from-[#38b6ff]/50 dark:via-[#38b6ff]/40 dark:to-[#38b6ff]/30 ${className ?? ""}`}
      style={{ width: size, height: size }}
      title={normalized}
      aria-hidden
    >
      <span className="text-[#38b6ff] dark:text-[#38b6ff] font-bold text-sm drop-shadow-sm">{label}</span>
    </div>
  );
}
