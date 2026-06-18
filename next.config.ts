import type { NextConfig } from "next";
// @ts-expect-error missing types
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  async redirects() {
    return [
      { source: '/companion', destination: '/nova', permanent: true },
      { source: '/ai', destination: '/nova', permanent: true },
    ];
  },
};

export default withPWA(nextConfig);
