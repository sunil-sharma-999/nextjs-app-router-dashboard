const PHASE_DEVELOPMENT_SERVER = (require = 'next/dist/shared/lib/constants')
  .PHASE_DEVELOPMENT_SERVER;

module.exports = (phase, { defaultConfig }) => {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    ...defaultConfig,
    compress: true,
  };
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    nextConfig.compiler.removeConsole = {
      exclude: ['error'],
    };
  }
  return nextConfig;
};
