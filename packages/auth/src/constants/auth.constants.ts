/**
 * Tokens de inyección de dependencias para el módulo de autenticación.
 *
 * En NestJS, cuando queremos inyectar un valor (objeto, clase, string) que no es
 * una clase concreta, usamos un "token" como identificador. Estos tokens se usan
 * en los providers del módulo con `provide: TOKEN` y en los constructores con
 * `@Inject(TOKEN)`.
 */

/** Token para inyectar las opciones de configuración del módulo (secret, expiresIn, etc.) */
export const AUTH_OPTIONS = 'AUTH_OPTIONS';

/** Token para inyectar el repositorio de usuarios provisto por el proyecto consumidor */
export const USER_REPOSITORY = 'USER_REPOSITORY';

/** Clave de metadata usada por el decorador @Roles() para guardar los roles en el handler */
export const ROLES_KEY = 'roles';

/** Clave de metadata usada por el decorador @Public() para marcar rutas como públicas */
export const IS_PUBLIC_KEY = 'isPublic';
