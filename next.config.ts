import type { NextConfig } from "next";

function storageImagePatterns() {
  const patterns: Array<{ protocol: "http" | "https"; hostname: string; port?: string; pathname: string }> = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "9000", pathname: "/**" },
  ];
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (!base) return patterns;
  try {
    const url = new URL(base);
    patterns.push({
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/**",
    });
  } catch {
    return patterns;
  }
  return patterns;
}

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@aws-sdk/client-s3", "@prisma/client", "sharp"],
  images: {
    remotePatterns: storageImagePatterns(),
  },
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
