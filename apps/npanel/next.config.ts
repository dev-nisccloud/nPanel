import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Still check types during build (important for catching errors)
    ignoreBuildErrors: false,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  serverExternalPackages: ["@prisma/client", "@nPanel/db", "canvas", "pdfjs-dist", "@react-pdf/renderer"],
  webpack: (config, { isServer }) => {
    // Exclude canvas from client-side bundles
    // Canvas is a Node.js native module that pdfjs-dist uses for server-side rendering
    // It's not needed (and won't work) in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
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
