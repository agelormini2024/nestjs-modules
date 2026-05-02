import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard que activa la estrategia Local de Passport en el endpoint de login.
 *
 * Cuando se aplica a una ruta, Passport intercepta el request, extrae
 * `email` y `password` del body, y los pasa a `LocalStrategy.validate()`.
 * Si la validación falla, retorna 401 automáticamente.
 *
 * Solo se usa en el endpoint de login — todas las demás rutas usan `JwtAuthGuard`.
 *
 * @example
 * @Public()
 * @UseGuards(LocalAuthGuard)
 * @Post('login')
 * async login(@CurrentUser() user: AuthUser) {
 *   return this.authService.login(user);
 * }
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
