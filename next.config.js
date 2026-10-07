/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Subida del logo en Perfil (server action): por defecto el límite es 1 MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
};
module.exports = nextConfig;
