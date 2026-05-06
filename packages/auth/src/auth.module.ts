import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AUTH_OPTIONS, USER_REPOSITORY } from './constants/auth.constants';
import { AuthModuleAsyncOptions, AuthModuleOptions } from './interfaces/auth-module-options.interface';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

/**
 * Módulo principal de autenticación.
 *
 * Se configura mediante `forRootAsync()` siguiendo el patrón de módulos
 * dinámicos de NestJS. Este patrón permite que la configuración (secret,
 * expiresIn, repositorio de usuarios) se resuelva en tiempo de ejecución,
 * lo que es necesario para integrarse con `ConfigService` u otros providers.
 *
 * Qué expone al proyecto consumidor:
 * - `AuthService`  → para llamar a `login()` desde el controller
 * - `JwtModule`    → por si el proyecto necesita firmar tokens adicionales
 *
 * Qué registra internamente (no exportado):
 * - `JwtStrategy`   → valida tokens en cada request protegido
 * - `LocalStrategy` → valida email/password en el login
 *
 * @example
 * // app.module.ts del proyecto consumidor
 * @Module({
 *   imports: [
 *     AuthModule.forRootAsync({
 *       userRepository: PrismaUserRepository,
 *       useFactory: (config: ConfigService) => ({
 *         secret: config.get('JWT_SECRET'),
 *         expiresIn: '7d',
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
@Module({})
export class AuthModule {
  static forRootAsync(asyncOptions: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: [
        ...(asyncOptions.imports ?? []),
        PassportModule,
        /**
         * JwtModule.registerAsync corre la misma factory que AuthModule recibió,
         * transformando el resultado a las opciones que JwtModule necesita.
         * Se pasan directamente imports e inject para evitar cruzar scopes de módulo
         * (el token AUTH_OPTIONS no es visible dentro del contexto de JwtModule).
         */
        JwtModule.registerAsync({
          imports: asyncOptions.imports ?? [],
          useFactory: async (...args: any[]) => {
            const options: AuthModuleOptions = await Promise.resolve(
              asyncOptions.useFactory(...args),
            );
            return {
              secret: options.secret,
              signOptions: { expiresIn: options.expiresIn ?? '7d' },
            };
          },
          inject: asyncOptions.inject ?? [],
        }),
      ],
      providers: [
        /**
         * Provider de las opciones: ejecuta useFactory con los servicios de inject[]
         * y registra el resultado bajo el token AUTH_OPTIONS para que JwtStrategy
         * y JwtModule puedan leerlo.
         */
        {
          provide: AUTH_OPTIONS,
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject ?? [],
        },
        /**
         * Provider del repositorio de usuarios: registra la clase provista por
         * el proyecto consumidor bajo el token USER_REPOSITORY.
         */
        {
          provide: USER_REPOSITORY,
          useClass: asyncOptions.userRepository,
        },
        AuthService,
        JwtStrategy,
        LocalStrategy,
      ],
      exports: [AuthService, JwtModule],
    };
  }
}
