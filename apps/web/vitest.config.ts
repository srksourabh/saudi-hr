import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "."),
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@db": path.resolve(__dirname, "../../packages/db/src"),
      "@auth": path.resolve(__dirname, "../../packages/auth/src"),
      "@validators": path.resolve(__dirname, "../../packages/validators/src"),
      "@config": path.resolve(__dirname, "../../packages/config/src"),
      "@email": path.resolve(__dirname, "../../packages/email/src"),
    },
  },
});
