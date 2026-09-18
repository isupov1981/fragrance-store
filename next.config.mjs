/** @type {import('next').NextConfig} */
function storageImagePatterns() {
  const patterns = [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "https", hostname: "media.parfums.cloud", pathname: "/**" },
    { protocol: "https", hostname: "parfums.cloud", pathname: "/**" },
    { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/**" },
    { protocol: "https", hostname: "cdn.jsdelivr.net", pathname: "/**" },
    { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "9000", pathname: "/**" },
    { protocol: "http", hostname: "localhost", port: "3000", pathname: "/api/media/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "3000", pathname: "/api/media/**" },
  ];
  for (const raw of [process.env.NEXT_PUBLIC_SITE_URL, process.env.S3_PUBLIC_BASE_URL]) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      patterns.push({
        protocol: url.protocol === "http:" ? "http" : "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/**",
      });
    } catch {
      /* ignore bad env */
    }
  }
  return patterns;
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

if (process.env.NODE_ENV === "production") {
  const preload = process.env.HSTS_PRELOAD === "true" ? "; preload" : "";
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: `max-age=31536000; includeSubDomains${preload}`,
  });
}

const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@aws-sdk/client-s3", "@prisma/client", "sharp", "@google/genai"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*", "./node_modules/@prisma/client/**/*"],
  },
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
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
