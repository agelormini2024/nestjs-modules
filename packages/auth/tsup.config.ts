import { defineConfig } from 'tsup';

/**
 * Configuración de tsup para el paquete @agelormini2024/auth.
 *
 * tsup es el bundler que convierte el código TypeScript en los archivos
 * distribuibles que los proyectos consumidores van a instalar.
 *
 * Se generan dos formatos:
 * - CJS (CommonJS): para proyectos Node.js tradicionales y NestJS
 * - ESM (ES Modules): para proyectos modernos que usen import/export nativo
 *
 * Las dependencias de NestJS y Passport se declaran como "external" porque
 * son peerDependencies: el proyecto consumidor ya las tiene instaladas y
 * no deben incluirse dentro del bundle del paquete.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    // NestJS + Passport: peerDependencies, el consumidor ya las tiene
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/jwt',
    '@nestjs/passport',
    'passport',
    'passport-jwt',
    'passport-local',
    'reflect-metadata',
    // bcrypt usa un binding nativo (.node). Si se bundlea, __dirname del bundle
    // apunta al directorio de output (dist/) y node-gyp-build no puede encontrar
    // el prebuild. Marcándolo external, el require se resuelve en runtime desde
    // node_modules del consumidor donde el binario está correctamente instalado.
    'bcrypt',
  ],
});
