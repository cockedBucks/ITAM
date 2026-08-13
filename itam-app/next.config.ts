import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Force dynamic rendering for pages that depend on Supabase */
  experimental: {},
};

export default nextConfig;
