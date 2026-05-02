/**
 * Representa los datos mínimos de un usuario que el módulo de autenticación necesita.
 *
 * El proyecto consumidor puede tener más campos en su modelo de usuario (nombre,
 * teléfono, plan, etc.), pero el módulo solo opera con estos.
 */
export interface AuthUser {
  /** Identificador único del usuario (UUID o ID numérico como string). */
  id: string;

  /** Email usado como credencial de acceso. */
  email: string;

  /** Password hasheado con bcrypt. El módulo lo compara internamente, nunca lo expone. */
  password: string;

  /** Roles del usuario para el control de acceso (RBAC). Ej: ['admin', 'editor']. */
  roles: string[];
}

/**
 * Contrato que el proyecto consumidor debe implementar para proveer acceso a los usuarios.
 *
 * Se usa una clase abstracta (no una interface) porque las interfaces de TypeScript
 * desaparecen en runtime y NestJS necesita un token real para el sistema de
 * inyección de dependencias.
 *
 * @example
 * // En el proyecto consumidor (con Prisma):
 * @Injectable()
 * export class PrismaUserRepository extends UserRepository {
 *   constructor(private prisma: PrismaService) { super(); }
 *
 *   async findByEmail(email: string): Promise<AuthUser | null> {
 *     return this.prisma.user.findUnique({ where: { email } });
 *   }
 *
 *   async findById(id: string): Promise<AuthUser | null> {
 *     return this.prisma.user.findUnique({ where: { id } });
 *   }
 * }
 */
export abstract class UserRepository {
  /** Busca un usuario por email. Retorna null si no existe. */
  abstract findByEmail(email: string): Promise<AuthUser | null>;

  /** Busca un usuario por ID. Retorna null si no existe. */
  abstract findById(id: string): Promise<AuthUser | null>;
}
