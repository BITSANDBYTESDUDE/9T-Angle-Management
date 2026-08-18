/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_PROXY_TARGET || "http://localhost:5000"}/api/:path*` }];
  },
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] }
};

export default nextConfig;
