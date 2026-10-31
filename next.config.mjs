/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // imagen liviana para Cloud Run
  poweredByHeader: false,
  serverExternalPackages: ["postgres", "@google-cloud/storage"],
  experimental: {
    serverActions: { bodySizeLimit: "30mb" }, // subida de documentos (máx. 25 MB por archivo)
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
