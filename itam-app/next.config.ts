import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Force dynamic rendering for pages that depend on Supabase */
  experimental: {},
  /* Allow VMs on the local network to access dev resources */
  allowedDevOrigins: ['192.168.56.1'],
};

export default nextConfig;
