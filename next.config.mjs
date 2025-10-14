import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 启用standalone输出模式，用于Docker部署
  // 暂时禁用以避免Windows符号链接权限问题
  output: 'standalone',

  // 优化资源预加载策略，减少未使用警告
  experimental: {
    optimizeCss: true,
  },
}

export default withNextIntl(nextConfig);
