/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/exportado", destination: "/clientes", permanent: false },
      { source: "/exportado/:id", destination: "/clientes/oc/:id", permanent: false },
      { source: "/pagos", destination: "/productores/pagos", permanent: false },
      { source: "/ingesta", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
