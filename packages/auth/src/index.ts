/**
 * @package @agelormini2024/auth
 *
 * Módulo de autenticación reutilizable para NestJS.
 * Exporta todo lo que el proyecto consumidor necesita para integrar auth completo.
 */

// Módulo principal — punto de entrada para NestJS
export { AuthModule } from './auth.module';

// Servicio — para llamar a login() desde el controller del proyecto
export { AuthService } from './auth.service';
export type { LoginResult } from './auth.service';

// Guards — para proteger rutas
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { LocalAuthGuard } from './guards/local-auth.guard';
export { RolesGuard } from './guards/roles.guard';

// Decoradores — para usar en controllers
export { CurrentUser } from './decorators/current-user.decorator';
export { Roles } from './decorators/roles.decorator';
export { Public } from './decorators/public.decorator';

// Interfaces y clases abstractas — para implementar en el proyecto consumidor
export { UserRepository } from './interfaces/user-repository.interface';
export type { AuthUser } from './interfaces/user-repository.interface';
export type { AuthModuleOptions, AuthModuleAsyncOptions } from './interfaces/auth-module-options.interface';
export type { JwtPayload } from './interfaces/jwt-payload.interface';
