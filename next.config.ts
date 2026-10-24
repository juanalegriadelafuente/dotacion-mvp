import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      // La página personal pasó a «Quiénes somos» (D-ING-4).
      { source: "/sobre-mi", destination: "/nosotros", permanent: true },
    ];
  },
};

export default nextConfig;
