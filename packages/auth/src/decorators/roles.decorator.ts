import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/auth.constants';

/**
 * Decorador que declara qué roles tienen acceso a una ruta o controller.
 *
 * `SetMetadata` es la herramienta de NestJS para adjuntar metadatos a un handler.
 * Esos metadatos los lee `RolesGuard` en tiempo de ejecución usando `Reflector`.
 *
 * Se puede aplicar a nivel de método o de clase (controller completo).
 *
 * @example
 * // Solo admins pueden acceder:
 * @Roles('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete('usuario/:id')
 * eliminar() { ... }
 *
 * // Admins o editores:
 * @Roles('admin', 'editor')
 * @Get('dashboard')
 * dashboard() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
