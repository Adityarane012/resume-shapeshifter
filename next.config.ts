import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix: Next.js detected lockfiles in parent directories (C:\Users\Aditya Rane\package-lock.json).
  // Setting outputFileTracingRoot to this project's own directory silences the false-positive warning.
  outputFileTracingRoot: path.join(__dirname),

  // Fix: pdf-parse uses dynamic require() internally which Turbopack/webpack corrupts when bundled.
  // We also mark puppeteer-core and @sparticuz/chromium as externals to prevent Next.js from 
  // bundling the browser engine assets into the API chunks, preserving their binary search paths.
  serverExternalPackages: ['pdf-parse', 'puppeteer-core', '@sparticuz/chromium'],
};

export default nextConfig;
