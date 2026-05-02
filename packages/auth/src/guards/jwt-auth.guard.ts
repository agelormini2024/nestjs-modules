import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';

/**
 * Guard que protege rutas validando el token JWT del request.
 *
 * Extiende `AuthGuard('jwt')` de Passport, que internamente ejecuta
 * `JwtStrategy` para verificar el token del header Authorization.
 *
 * Agrega soporte para el decorador `@Public()`: si una ruta está marcada
 * como pública, el guard la deja pasar sin verificar el token.
 *
 * Uso recomendado — registrarlo globalmente para proteger todas las rutas:
 * @example
 * // app.module.ts
 * providers: [
 *   { provide: APP_GUARD, useClass: JwtAuthGuard }
 * ]
 *
 * // Y marcar solo las rutas públicas con @Public()
 * @Public()
 * @Post('login')
 * login() { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Se ejecuta antes de que Passport valide el token.
   * Si la ruta está marcada con @Public(), retorna true directamente.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
