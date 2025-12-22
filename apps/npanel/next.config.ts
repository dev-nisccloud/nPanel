import type { NextConfig } from "next";

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
    removeConsole: process.env.NODE_ENV === "production",
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
    ],
  },
  // Removed standalone output - it increases runtime memory usage
  // Using default output which is more memory-efficient for Render free tier
  // output: 'standalone',
  // Reduce memory usage during build
  experimental: {
    // Optimize memory usage
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "lucide-react",
      "date-fns",
      "recharts",
    ],
  },
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
