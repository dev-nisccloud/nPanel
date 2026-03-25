
const path = require('path');
const emailsDirRelativePath = path.normalize('./emails');
const userProjectLocation = 'C:/Users/somuo/Desktop/Projects/nPanel/packages/react-email-starter';
/** @type {import('next').NextConfig} */
module.exports = {
  env: {
    NEXT_PUBLIC_IS_BUILDING: 'true',
    EMAILS_DIR_RELATIVE_PATH: emailsDirRelativePath,
    EMAILS_DIR_ABSOLUTE_PATH: path.resolve(userProjectLocation, emailsDirRelativePath),
    PREVIEW_SERVER_LOCATION: 'C:/Users/somuo/Desktop/Projects/nPanel/packages/react-email-starter/.react-email',
    USER_PROJECT_LOCATION: userProjectLocation
  },
  // this is needed so that the code for building emails works properly
  webpack: (
    /** @type {import('webpack').Configuration & { externals: string[] }} */
    config,
    { isServer }
  ) => {
    if (isServer) {
      config.externals.push('esbuild');
    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    webpackBuildWorker: true
  },
}