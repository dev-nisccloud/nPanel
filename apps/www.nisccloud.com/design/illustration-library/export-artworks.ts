/**
 * Exports the development-only /__artwork-library route as reusable assets.
 * Run with the Vite development server active:
 *   bun design/illustration-library/export-artworks.ts
 */
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

type ArtworkRecord = {
  id: string;
  title: string;
  category: string;
  source: string;
  kind: string;
  mobile: boolean;
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
};

const baseUrl = process.argv[2] ?? "http://localhost:5174/__artwork-library";
const root = import.meta.dir;
const port = 9550 + Math.floor(Math.random() * 300);
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--hide-scrollbars",
  `--user-data-dir=${process.env.TEMP}/nisc-artwork-export-${port}`,
  "--window-size=1440,900",
  "about:blank",
]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let wsUrl = "";
for (let attempt = 0; attempt < 50 && !wsUrl; attempt += 1) {
  await wait(200);
  try {
    const targets = (await (
      await fetch(`http://127.0.0.1:${port}/json`)
    ).json()) as { type: string; webSocketDebuggerUrl: string }[];
    wsUrl = targets.find((target) => target.type === "page")?.webSocketDebuggerUrl ?? "";
  } catch {
    // Chrome may still be starting.
  }
}

if (!wsUrl) {
  chrome.kill();
  throw new Error("Could not connect to headless Chrome.");
}

const socket = new WebSocket(wsUrl);
await new Promise<void>((resolve, reject) => {
  socket.onopen = () => resolve();
  socket.onerror = () => reject(new Error("Could not open Chrome DevTools connection."));
});

/** Minimal shape of a DevTools Protocol response; `result` differs per method. */
type CdpResponse = {
  id: number;
  result: { data: string; result?: { value?: unknown } } & Record<string, unknown>;
};

let requestId = 0;
const pending = new Map<number, (message: CdpResponse) => void>();
socket.onmessage = (event) => {
  const message = JSON.parse(String(event.data));
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)!(message);
    pending.delete(message.id);
  }
};

function send(method: string, params: object = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise<CdpResponse>((resolve) => pending.set(id, resolve));
}

async function evaluate<T>(expression: string): Promise<T> {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return response.result.result?.value as T;
}

async function setViewport(width: number) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
}

await send("Page.enable");
await send("Emulation.setEmulatedMedia", {
  features: [
    { name: "prefers-color-scheme", value: "light" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ],
});
await setViewport(1440);
await send("Page.navigate", { url: baseUrl });
await wait(5000);

const artworks = await evaluate<ArtworkRecord[]>(`
  [...document.querySelectorAll("[data-artwork-id]")].map((element) => ({
    id: element.getAttribute("data-artwork-id"),
    title: element.getAttribute("data-artwork-title"),
    category: element.getAttribute("data-artwork-category"),
    source: element.getAttribute("data-artwork-source"),
    kind: element.getAttribute("data-artwork-kind"),
    mobile: element.getAttribute("data-mobile-variant") === "true"
  }))
`);

for (const artwork of artworks) {
  await mkdir(join(root, artwork.category), { recursive: true });
  const rect = await evaluate<{ x: number; y: number; width: number; height: number }>(`
    (() => {
      const element = document.querySelector('[data-artwork-id="${artwork.id}"]');
      element.scrollIntoView({ block: "center" });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height };
    })()
  `);
  await wait(100);

  const clip = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 2 };
  const png = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip,
  });
  const webp = await send("Page.captureScreenshot", {
    format: "webp",
    quality: 88,
    captureBeyondViewport: true,
    clip,
  });
  await Bun.write(
    join(root, artwork.category, `${artwork.id}@2x.png`),
    Buffer.from(png.result.data, "base64"),
  );
  await Bun.write(
    join(root, artwork.category, `${artwork.id}.webp`),
    Buffer.from(webp.result.data, "base64"),
  );
  artwork.width = Math.round(rect.width * 2);
  artwork.height = Math.round(rect.height * 2);
  console.log(`${artwork.id}: ${artwork.width}x${artwork.height}`);
}

// Export responsive variants only where the source composition has a distinct mobile layout.
await setViewport(390);
await send("Page.navigate", { url: baseUrl });
await wait(4000);
for (const artwork of artworks.filter((item) => item.mobile)) {
  const rect = await evaluate<{ x: number; y: number; width: number; height: number }>(`
    (() => {
      const element = document.querySelector('[data-artwork-id="${artwork.id}"]');
      element.scrollIntoView({ block: "center" });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height };
    })()
  `);
  await wait(100);
  const clip = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 2.5 };
  const png = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip,
  });
  const webp = await send("Page.captureScreenshot", {
    format: "webp",
    quality: 88,
    captureBeyondViewport: true,
    clip,
  });
  await Bun.write(
    join(root, artwork.category, `${artwork.id}-mobile@2x.png`),
    Buffer.from(png.result.data, "base64"),
  );
  await Bun.write(
    join(root, artwork.category, `${artwork.id}-mobile.webp`),
    Buffer.from(webp.result.data, "base64"),
  );
  artwork.mobileWidth = Math.round(rect.width * 2.5);
  artwork.mobileHeight = Math.round(rect.height * 2.5);
}

// Re-open the desktop contact-sheet layout and capture it as one review artifact.
await setViewport(1440);
await send("Page.navigate", { url: baseUrl });
await wait(4000);
const page = await evaluate<{ width: number; height: number }>(
  `({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
);
const contactClip = {
  x: 0,
  y: 0,
  width: Math.min(page.width, 1440),
  height: Math.min(page.height, 16000),
  scale: 1,
};
const contactPng = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: contactClip,
});
const contactWebp = await send("Page.captureScreenshot", {
  format: "webp",
  quality: 82,
  captureBeyondViewport: true,
  clip: contactClip,
});
await Bun.write(join(root, "contact-sheet.png"), Buffer.from(contactPng.result.data, "base64"));
await Bun.write(join(root, "contact-sheet.webp"), Buffer.from(contactWebp.result.data, "base64"));
await Bun.write(
  join(root, "inventory.json"),
  `${JSON.stringify({ exportedAt: new Date().toISOString(), artworks }, null, 2)}\n`,
);

socket.close();
chrome.kill();
console.log(`Exported ${artworks.length} artworks to ${root}`);
process.exit(0);
