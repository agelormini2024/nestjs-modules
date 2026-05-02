import { defineConfig } from 'tsup';

/**
 * Configuración de tsup para el paquete @agelormini2024/payments.
 *
 * Los SDKs de Stripe y MercadoPago se declaran como external porque
 * cada proyecto consumidor los instala directamente: así el bundle
 * no incluye código de terceros y las versiones las controla el proyecto.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    '@nestjs/common',
    '@nestjs/core',
    'reflect-metadata',
    'stripe',
    'mercadopago',
  ],
});
