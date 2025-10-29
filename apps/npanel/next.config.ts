import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  serverExternalPackages: ["@prisma/client", "@nPanel/db"],
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
