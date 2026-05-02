/**
 * Forma del payload que se almacena dentro del token JWT.
 *
 * El payload es la parte "visible" del token (está codificada en Base64, no encriptada).
 * Por eso solo incluimos datos no sensibles: nunca el password ni información privada.
 *
 * Convención JWT estándar (RFC 7519):
 * - `sub` (subject): identificador único del usuario
 * - `iat` (issued at): timestamp de emisión — lo agrega la librería automáticamente
 * - `exp` (expiration): timestamp de expiración — lo agrega la librería automáticamente
 */
export interface JwtPayload {
  /** ID único del usuario. Se usa como `sub` por convención del estándar JWT. */
  sub: string;

  /** Email del usuario. Permite identificarlo sin hacer una consulta a la DB en cada request. */
  email: string;

  /** Roles del usuario. Permite que RolesGuard valide permisos sin consultar la DB. */
  roles: string[];
}
