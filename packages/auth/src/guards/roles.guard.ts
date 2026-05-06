import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/auth.constants';
import type { AuthUser } from '../interfaces/user-repository.interface';

/**
 * Guard de control de acceso basado en roles (RBAC).
 *
 * Lee los roles requeridos del decorador `@Roles()` y los compara con
 * los roles del usuario autenticado que está en `request.user`.
 *
 * Importante: `RolesGuard` debe aplicarse DESPUÉS de `JwtAuthGuard` porque
 * necesita que `request.user` esté poblado. Si se invierte el orden, el usuario
 * no estará disponible aún y el guard siempre denegará el acceso.
 *
 * Si la ruta no tiene `@Roles()`, el guard deja pasar sin verificar.
 *
 * @example
 * @Roles('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete('usuarios/:id')
 * eliminar() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    /** Si la ruta no declara roles requeridos, cualquier usuario autenticado puede acceder */
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    /** Verifica que el usuario tenga AL MENOS UNO de los roles requeridos */
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
}
