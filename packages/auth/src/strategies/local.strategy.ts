import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthUser } from '../interfaces/user-repository.interface';
import { AuthService } from '../auth.service';

/**
 * Estrategia Local de Passport para validar credenciales email/password.
 *
 * Esta estrategia se usa exclusivamente en el endpoint de login.
 * Por defecto, `passport-local` busca los campos `username` y `password`
 * en el body del request. Aquí se reconfigura para usar `email` en lugar
 * de `username`, que es el campo estándar en aplicaciones modernas.
 *
 * Flujo del login:
 *   1. El controller recibe POST /auth/login con { email, password }
 *   2. `LocalAuthGuard` activa esta estrategia automáticamente
 *   3. Passport extrae email y password del body
 *   4. Llama a `validate()` con esos valores
 *   5. `validate()` delega en `AuthService.validateUser()`
 *   6. El usuario validado se adjunta a `request.user`
 *   7. El controller recibe el usuario en `@CurrentUser()` y genera el token
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      /** Renombramos el campo de username a email */
      usernameField: 'email',
    });
  }

  /**
   * Valida las credenciales del usuario.
   * Si son inválidas, lanza UnauthorizedException y Passport retorna 401.
   */
  async validate(email: string, password: string): Promise<AuthUser> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return user;
  }
}
