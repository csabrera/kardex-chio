import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Determine backend URL based on environment
    let backendUrl = 'http://localhost:3011';

    if (process.env.NODE_ENV === 'production') {
      // Railway production
      backendUrl = 'https://backend-production-14c8.up.railway.app';
    }

    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
