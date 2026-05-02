import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';

/**
 * Decorador que marca una ruta como pública, saltando la validación del JWT.
 *
 * El caso de uso típico es registrar `JwtAuthGuard` de forma global en el módulo
 * principal (para proteger todas las rutas por defecto) y usar `@Public()` solo
 * en las rutas que no requieren autenticación (login, registro, health check).
 *
 * `JwtAuthGuard` lee este metadato con `Reflector` antes de validar el token.
 *
 * @example
 * // app.module.ts — guard global:
 * providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
 *
 * // auth.controller.ts — rutas públicas:
 * @Public()
 * @Post('login')
 * login() { ... }
 *
 * @Public()
 * @Post('registro')
 * registro() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
