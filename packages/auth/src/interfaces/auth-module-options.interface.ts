import { ModuleMetadata, Type } from '@nestjs/common';

/**
 * Opciones de configuración que recibe el módulo de autenticación.
 * Se pasan a través de `AuthModule.forRootAsync()` desde el proyecto consumidor.
 */
export interface AuthModuleOptions {
  /** Clave secreta usada para firmar y verificar los tokens JWT. Debe venir de variables de entorno. */
  secret: string;

  /** Tiempo de expiración del token. Acepta el formato de la librería `ms` (ej: '7d', '1h', '30m'). Por defecto '7d'. */
  expiresIn?: string;
}

/**
 * Opciones para configurar el módulo de forma asíncrona con `forRootAsync()`.
 *
 * El patrón asíncrono existe porque en NestJS la configuración suele depender
 * de servicios como `ConfigService` que se resuelven en tiempo de ejecución,
 * no en tiempo de importación del módulo.
 *
 * @example
 * AuthModule.forRootAsync({
 *   userRepository: PrismaUserRepository,
 *   useFactory: (config: ConfigService) => ({
 *     secret: config.get('JWT_SECRET'),
 *     expiresIn: '7d',
 *   }),
 *   inject: [ConfigService],
 * })
 */
export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Clase que implementa `UserRepository`. El módulo la instancia y la usa
   * internamente para buscar usuarios durante el login y la validación del token.
   */
  userRepository: Type<any>;

  /**
   * Función de fábrica que devuelve las opciones del módulo.
   * Puede ser asíncrona para esperar la resolución de otros servicios.
   */
  useFactory: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions;

  /**
   * Lista de proveedores que se inyectan en `useFactory`.
   * Equivale al array `inject` de un provider estándar de NestJS.
   */
  inject?: any[];
}
