import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /* Memories accept photos up to 10 MB plus multipart overhead. */
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
