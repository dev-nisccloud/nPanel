/**
 * Response headers for every page and asset, shared by vercel.json (generated) and server.ts.
 * Card payments leave the site through a form POST to the payment provider, so form-action
 * must allow https: destinations. vercel.live is only used by Vercel preview toolbars.
 * instagram.com is the reel player on Our Work.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://vercel.live https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://npanel.nisccloud.com https://vercel.live",
  "frame-src https://vercel.live https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https:",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];
