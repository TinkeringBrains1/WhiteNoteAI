/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // This is required to fix the 500 error!
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
}

export default nextConfig