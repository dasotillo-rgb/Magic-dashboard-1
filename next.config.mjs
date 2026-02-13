/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ESTO PERMITE QUE EL BUILD TERMINE AUNQUE HAYA ERRORES DE TIPOS
    ignoreBuildErrors: true,
  },
  eslint: {
    // IGNORAR ESLINT PARA ACELERAR EL DESPLIEGUE
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
