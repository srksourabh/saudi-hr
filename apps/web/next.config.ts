import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@hrms-app/ui",
    "@hrms-app/db",
    "@hrms-app/auth",
    "@hrms-app/validators",
    "@hrms-app/config",
    "@hrms-app/email",
  ],
  experimental: {
    optimizePackageImports: ["@hrms-app/ui", "lucide-react"],
  },
};

export default nextConfig;
