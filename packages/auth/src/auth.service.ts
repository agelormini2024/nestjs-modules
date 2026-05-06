import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from './constants/auth.constants';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRepository } from './interfaces/user-repository.interface';
import type { AuthUser } from './interfaces/user-repository.interface';

/** Respuesta que devuelve el login con el token de acceso */
export interface LoginResult {
  accessToken: string;
  user: Omit<AuthUser, 'password'>;
}

/**
 * Servicio principal del módulo de autenticación.
 *
 * Encapsula la lógica de negocio de auth:
 * - Validar credenciales (email + password)
 * - Generar tokens JWT
 *
 * Es el único lugar del módulo que conoce bcrypt. Los proyectos consumidores
 * no necesitan instalar ni importar bcrypt directamente.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida que el email exista y que el password coincida con el hash almacenado.
   * Retorna el usuario sin el password si las credenciales son correctas, o null si no lo son.
   *
   * Es llamado por `LocalStrategy` durante el proceso de login.
   */
  async validateUser(email: string, password: string): Promise<Omit<AuthUser, 'password'> | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _removed, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Genera un token JWT para el usuario autenticado.
   *
   * Llamar a este método es el último paso del login: se llama desde el controller
   * después de que `LocalAuthGuard` valida las credenciales.
   *
   * @param user - El usuario autenticado (sin password), provisto por `LocalStrategy`
   */
  async login(user: Omit<AuthUser, 'password'>): Promise<LoginResult> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
