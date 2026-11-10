/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Subida del logo en Perfil (server action): por defecto el límite es 1 MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
  // Plantillas de las webs de clientes (lib/web-publish/source.ts): se leen del
  // disco en el servidor, así que hay que incluirlas en las funciones que las
  // usan — la vista previa de «Mi web» y la página /mi-web (acción «Publicar»).
  outputFileTracingIncludes: {
    "/api/mi-web/preview/[...path]": ["./web-sites/**/*"],
    "/mi-web": ["./web-sites/**/*"],
  },
};
module.exports = nextConfig;
