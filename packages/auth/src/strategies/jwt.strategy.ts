import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_OPTIONS, USER_REPOSITORY } from '../constants/auth.constants';
import { AuthModuleOptions } from '../interfaces/auth-module-options.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthUser, UserRepository } from '../interfaces/user-repository.interface';

/**
 * Estrategia JWT de Passport para NestJS.
 *
 * Passport es un middleware de autenticación que trabaja con "estrategias".
 * Cada estrategia sabe cómo extraer y validar credenciales de un request.
 * Esta estrategia específica:
 *   1. Extrae el token JWT del header `Authorization: Bearer <token>`
 *   2. Lo verifica con el secret (firma) y comprueba que no esté expirado
 *   3. Llama a `validate()` con el payload decodificado
 *   4. El valor que retorna `validate()` se adjunta a `request.user`
 *
 * Si el token es inválido o está expirado, Passport retorna 401 automáticamente
 * antes de llegar a `validate()`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(AUTH_OPTIONS) private readonly options: AuthModuleOptions,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {
    super({
      /** Extrae el token del header Authorization como Bearer token */
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      /** Si el token está expirado, Passport lo rechaza antes de llamar a validate() */
      ignoreExpiration: false,
      secretOrKey: options.secret,
    });
  }

  /**
   * Se ejecuta después de que Passport verifica la firma y expiración del token.
   * Aquí validamos que el usuario todavía exista en la base de datos.
   *
   * El valor retornado se asigna a `request.user` y es lo que recibe
   * el decorador `@CurrentUser()` en los controllers.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('El usuario del token ya no existe');
    }

    return user;
  }
}
