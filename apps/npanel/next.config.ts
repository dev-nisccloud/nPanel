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
  // Optimize for memory-constrained environments
  swcMinify: true,
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
      };
    }

    // Optimize memory usage during build
    if (!dev) {
      // Reduce memory usage by limiting chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
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
