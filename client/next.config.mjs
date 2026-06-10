import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`
      }
    ];
  }
};

export default function config(phase) {
  return {
    ...nextConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"
  };
}
