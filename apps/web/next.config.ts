import type { NextConfig } from "next";

// External hosts the browser actually contacts (PRIV-002) — explicit allow-list
// instead of blanket https: so injected code has no open exfiltration channel.
const SUPABASE_STORAGE_HOST = "https://iefwhxxhrycaalhxkfgp.supabase.co"; // uploaded documents (api/upload)
const OSM_TILE_HOSTS = "https://tile.openstreetmap.org https://*.tile.openstreetmap.org"; // Leaflet location picker
const OPENFREEMAP_HOST = "https://tiles.openfreemap.org"; // MapLibre guide map (style/tiles/glyphs via fetch)

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' dropped (F1). 'unsafe-inline' retained pending a nonce-based
  // rollout — Next's inline bootstrap scripts require it until nonces are wired (PRIV-001).
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${SUPABASE_STORAGE_HOST} ${OSM_TILE_HOSTS} ${OPENFREEMAP_HOST}`,
  "font-src 'self' https://frontend-cdn.perplexity.ai",
  `connect-src 'self' ${SUPABASE_STORAGE_HOST} ${OPENFREEMAP_HOST}`,
  // maplibre-gl spawns its render worker from a blob: URL; without an explicit
  // worker-src it would fall back to script-src and be blocked.
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // HSTS: force HTTPS for 2 years incl. subdomains (F1 / SEC-006).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
];

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
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
