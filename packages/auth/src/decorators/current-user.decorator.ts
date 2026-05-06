import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../interfaces/user-repository.interface';

/**
 * Decorador de parámetro que extrae el usuario autenticado del request.
 *
 * NestJS permite crear decoradores personalizados para los parámetros de los
 * métodos de un controller. `createParamDecorator` recibe una función que tiene
 * acceso al contexto de ejecución (HTTP, WebSocket, gRPC) y devuelve el valor
 * que se inyectará en el parámetro.
 *
 * El usuario es colocado en `request.user` por la estrategia JWT de Passport
 * después de validar el token exitosamente.
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('perfil')
 * getPerfil(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 *
 * // También se puede pedir solo una propiedad:
 * @Get('perfil')
 * getPerfil(@CurrentUser('email') email: string) {
 *   return email;
 * }
 */
export const CurrentUser = createParamDecorator(
  (property: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    return property ? user?.[property] : user;
  },
);
