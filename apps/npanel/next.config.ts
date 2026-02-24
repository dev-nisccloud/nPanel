import path from "node:path";
import type { NextConfig } from "next";

// Monorepo root for standalone file tracing (pnpm symlinks + workspace packages)
const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  // Disable typedRoutes during build to save memory (can be enabled locally)
  // typedRoutes: true,
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during build to save memory on free tier
    // Types are still checked via `pnpm run check-types` in CI/local
    ignoreBuildErrors: true,
  },
  compiler: {
    // Keep error/warn in production so root-route and auth failures show in Cloud Run logs
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "**.replicate.delivery",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  // Output standalone for Docker builds to optimize container size
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
  // Trace from monorepo root so pnpm symlinks and workspace packages (@nPanel/db) resolve in standalone
  ...(process.env.DOCKER_BUILD === "true"
    ? {
        outputFileTracingRoot: monorepoRoot,
        outputFileTracingIncludes: {
          "/api/**": ["packages/db/**/*", "node_modules/@prisma/client/**/*"],
          "/**": ["packages/db/**/*"],
        },
      }
    : {}),
  // Reduce memory usage during build
  // NOTE: Disabled optimizePackageImports for now because it can trigger
  // Next.js 15.x clientReferenceManifest build bugs in some setups.
  // Re‑enable once upstream bug is resolved.
  // experimental: {
  //   optimizePackageImports: [
  //     "@radix-ui/react-dialog",
  //     "@radix-ui/react-dropdown-menu",
  //     "@radix-ui/react-popover",
  //     "@radix-ui/react-select",
  //     "lucide-react",
  //     "date-fns",
  //     "recharts",
  //   ],
  // },
  serverExternalPackages: ["@prisma/client", "@nPanel/db", "canvas", "pdfjs-dist", "@react-pdf/renderer", "google-ads-api"],
  webpack: (config, { isServer, dev }) => {
    // Exclude canvas from client-side bundles
    // Canvas is a Node.js native module that pdfjs-dist uses for server-side rendering
    // It's not needed (and won't work) in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        jsdom: false, // Fabric.js tries to require jsdom in Node.js, but we use it client-side only
      };
    }

    // Ignore jsdom for both server and client since fabric.js is client-side only
    config.resolve.alias = {
      ...config.resolve.alias,
      jsdom: false,
    };

    // Optimize memory usage during build
    if (!dev) {
      // Reduce memory usage by limiting chunk splitting and parallel processing
      config.optimization = {
        ...config.optimization,
        // Reduce parallel processing to save memory
        minimize: true,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Only split large vendor chunks to reduce memory pressure
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              minChunks: 2,
              maxSize: 244000, // ~240KB chunks to reduce memory
            },
          },
        },
      };

      // Limit parallel module processing to reduce memory usage
      // Using 2 instead of 1 to balance memory and build time
      config.parallelism = 2;
    }

    return config;
  },
  async redirects() {
    return [
      // Remove the hardcoded dashboard redirect
      // Let middleware handle authentication and routing
      // {
      //   source: "/dashboard",
      //   destination: "/dashboard/default",
      //   permanent: false,
      // },
    ];
  },
};

export default nextConfig;
