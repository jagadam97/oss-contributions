import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",          // Static HTML export for GitHub Pages
  trailingSlash: true,       // GitHub Pages friendly URLs
  images: {
    unoptimized: true,       // Required for static export (no Image Optimization API)
  },
  // basePath is only needed if deploying to a subpath repo (e.g. /oss-contributions)
  // For a custom domain or user/org page, remove basePath.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export default nextConfig;
