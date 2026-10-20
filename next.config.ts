import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_OUTAGE_OPS_BUILD_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.OUTAGE_OPS_BUILD_COMMIT ?? "unknown",
  },
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
