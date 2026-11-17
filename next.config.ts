import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is deliberately left OFF. Every page in this app depends on
  // who is signed in, so pages are rendered fresh on each request (classic
  // dynamic rendering). This keeps the code simple and easy to explain.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
