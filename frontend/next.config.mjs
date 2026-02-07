/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: [
    `https://${process.env.REPLIT_DEV_DOMAIN}`,
    `http://${process.env.REPLIT_DEV_DOMAIN}`,
    process.env.REPLIT_DEV_DOMAIN,
    "http://localhost:5000",
    "http://0.0.0.0:5000",
    "http://127.0.0.1:5000",
    "localhost",
    "127.0.0.1",
  ].filter(Boolean),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
