import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin workspace root to this app (ignore parent C:\Users\Arjun R\package-lock.json)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
