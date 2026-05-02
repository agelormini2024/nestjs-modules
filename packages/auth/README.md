# @agelormini2024/auth

Módulo de autenticación reutilizable para NestJS. Provee JWT, login con email/password, guards y decoradores listos para usar. El proyecto consumidor solo necesita implementar una clase que diga cómo buscar usuarios en su base de datos.

## Qué incluye

- **`AuthModule`** — módulo dinámico que se configura con `forRootAsync()`
- **`AuthService`** — lógica de login y validación de credenciales
- **`JwtAuthGuard`** — protege rutas verificando el token JWT
- **`LocalAuthGuard`** — valida email/password en el endpoint de login
- **`RolesGuard`** — control de acceso basado en roles (RBAC)
- **`@CurrentUser()`** — decorador para obtener el usuario autenticado en un controller
- **`@Roles()`** — decorador para declarar qué roles pueden acceder a una ruta
- **`@Public()`** — decorador para marcar rutas que no requieren autenticación
- **`UserRepository`** — clase abstracta que el proyecto debe implementar

---

## Instalación

```bash
pnpm add @agelormini2024/auth
```

### Dependencias de pares (peer dependencies)

Este módulo requiere que el proyecto tenga instaladas las siguientes dependencias:

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/jwt @nestjs/passport \
  passport passport-jwt passport-local reflect-metadata
```

---

## Configuración

### 1. Implementar `UserRepository`

El módulo no sabe cómo está guardada la data en tu proyecto. Para eso necesita que implementes la clase abstracta `UserRepository`, que define el contrato mínimo para buscar usuarios.

```typescript
// src/users/prisma-user.repository.ts
import { Injectable } from '@nestjs/common';
import { AuthUser, UserRepository } from '@agelormini2024/auth';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

La interfaz `AuthUser` que debe cumplir el usuario retornado:

```typescript
interface AuthUser {
  id: string;
  email: string;
  password: string; // hash bcrypt — el módulo compara internamente
  roles: string[];  // ej: ['user'], ['admin', 'editor']
}
```

> **Nota sobre el password:** el módulo usa `bcrypt` internamente para comparar el password recibido en el login contra el hash almacenado. El proyecto consumidor solo necesita guardar el hash — nunca el password en texto plano.

### 2. Registrar el módulo en `AppModule`

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@agelormini2024/auth';
import { PrismaUserRepository } from './users/prisma-user.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    AuthModule.forRootAsync({
      // La clase que implementa UserRepository en este proyecto
      userRepository: PrismaUserRepository,

      // useFactory resuelve las opciones en tiempo de ejecución,
      // lo que permite leer el secret desde variables de entorno
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        expiresIn: '7d', // opcional, por defecto '7d'
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Variables de entorno requeridas

```env
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura
```

---

## Uso

### Endpoint de login

El flujo de login requiere dos pasos: `LocalAuthGuard` valida las credenciales y, si son correctas, el controller llama a `authService.login()` para generar el token.

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService, CurrentUser, LocalAuthGuard, Public, AuthUser } from '@agelormini2024/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()           // esta ruta no requiere token
  @UseGuards(LocalAuthGuard) // valida email + password del body
  @Post('login')
  async login(@CurrentUser() user: AuthUser) {
    // user es el resultado de UserRepository.findByEmail() sin el campo password
    return this.authService.login(user);
  }
}
```

**Request:**
```json
POST /auth/login
{
  "email": "usuario@example.com",
  "password": "miPassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@example.com",
    "roles": ["user"]
  }
}
```

---

### Proteger rutas con `JwtAuthGuard`

#### Opción A — Guard por ruta (granular)

Aplicar `@UseGuards(JwtAuthGuard)` en cada ruta o controller que requiera autenticación.

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, AuthUser } from '@agelormini2024/auth';

@Controller('perfil')
export class PerfilController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getPerfil(@CurrentUser() user: AuthUser) {
    return user;
  }
}
```

#### Opción B — Guard global (recomendado)

Registrar `JwtAuthGuard` globalmente protege todas las rutas por defecto. Las rutas públicas se marcan con `@Public()`.

```typescript
// src/app.module.ts
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@agelormini2024/auth';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

Con el guard global, cualquier ruta que no tenga `@Public()` requiere token automáticamente:

```typescript
@Controller('productos')
export class ProductosController {
  // Esta ruta requiere token (el guard global lo exige)
  @Get()
  listar() { ... }

  // Esta ruta es pública, cualquiera puede acceder
  @Public()
  @Get(':id')
  ver(@Param('id') id: string) { ... }
}
```

---

### Control de acceso por roles con `RolesGuard`

`RolesGuard` verifica que el usuario autenticado tenga al menos uno de los roles declarados en `@Roles()`. Siempre debe aplicarse **después** de `JwtAuthGuard` porque necesita que `request.user` esté disponible.

```typescript
import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@agelormini2024/auth';

@Controller('usuarios')
export class UsuariosController {

  // Solo admins pueden eliminar usuarios
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  eliminar(@Param('id') id: string) { ... }

  // Admins o moderadores pueden ver el listado
  @Roles('admin', 'moderador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  listar() { ... }
}
```

> Los roles son strings simples. El módulo no impone nombres específicos: `'admin'`, `'superadmin'`, `'editor'`, `'moderador'` — los que necesite el proyecto. Lo único necesario es que coincidan con los valores que devuelve `UserRepository.findById()` en el campo `roles`.

---

### Decorador `@CurrentUser()`

Extrae el usuario autenticado del request. Puede usarse con o sin argumento:

```typescript
// Obtiene el usuario completo (sin password)
@Get('perfil')
getPerfil(@CurrentUser() user: AuthUser) {
  return user; // { id, email, roles }
}

// Obtiene solo un campo
@Get('email')
getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

---

## Resumen del flujo completo

```
POST /auth/login { email, password }
        │
        ▼
  LocalAuthGuard
        │ activa LocalStrategy
        ▼
  LocalStrategy.validate()
        │ llama a AuthService.validateUser()
        ▼
  AuthService.validateUser()
        │ busca usuario con UserRepository.findByEmail()
        │ compara password con bcrypt
        ▼
  AuthController.login(@CurrentUser() user)
        │ llama a AuthService.login(user)
        ▼
  AuthService.login()
        │ firma el JWT con el payload { sub, email, roles }
        ▼
  { accessToken, user }


GET /ruta-protegida  Authorization: Bearer <token>
        │
        ▼
  JwtAuthGuard
        │ activa JwtStrategy
        ▼
  JwtStrategy.validate()
        │ verifica firma y expiración del token
        │ busca usuario con UserRepository.findById()
        │ adjunta usuario a request.user
        ▼
  Controller método
        │ @CurrentUser() recibe el usuario de request.user
        ▼
  respuesta
```

---

## API de referencia

### `AuthModule.forRootAsync(options)`

| Opción | Tipo | Requerido | Descripción |
|---|---|---|---|
| `userRepository` | `Type<UserRepository>` | Sí | Clase que implementa la búsqueda de usuarios |
| `useFactory` | `(...args) => AuthModuleOptions` | Sí | Función que retorna la configuración |
| `inject` | `any[]` | No | Servicios inyectados en `useFactory` |
| `imports` | `Module[]` | No | Módulos adicionales necesarios en `useFactory` |

### `AuthModuleOptions`

| Opción | Tipo | Default | Descripción |
|---|---|---|---|
| `secret` | `string` | — | Clave secreta para firmar el JWT |
| `expiresIn` | `string` | `'7d'` | Tiempo de expiración del token |
