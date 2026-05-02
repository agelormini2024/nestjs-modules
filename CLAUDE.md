# Librería de Módulos Reutilizables — Fuente de la Verdad

## Contexto del Proyecto

Librería personal de módulos NestJS reutilizables, publicados como paquetes privados en GitHub Packages vía pnpm. El objetivo es poder instalarlos en cualquier proyecto nuevo con un simple `pnpm add` y evitar reescribir lógica común entre proyectos freelance.

## Reglas de Colaboración

### Idioma
- Toda comunicación, comentarios, documentación y respuestas: **español siempre**.

### Flujo de Trabajo por Fases
- **No escribir código hasta que se confirme el inicio de cada fase.**
- Al iniciar cada fase, presentar el plan detallado y esperar confirmación antes de implementar.
- No reabrir decisiones técnicas ya tomadas y registradas en este archivo.

### Calidad
- Seguir las convenciones estándar de NestJS en todo momento.
- Cada feature debe tener sus tests antes de ser considerada completa.
- **Usar JSDoc y comentarios didácticos en todo el código**: cada clase, método, función, interfaz y tipo debe tener su JSDoc explicando qué hace, por qué existe y cómo usarlo. El objetivo es que cualquier desarrollador pueda entender el código sin contexto previo.

### Explicaciones
- Cuando aparece un concepto o patrón nuevo, explicarlo de forma didáctica antes o durante la implementación.

### README por módulo
- Al terminar cada módulo, confeccionar un README completo y didáctico en `packages/<modulo>/README.md`.
- Debe incluir: qué hace el módulo, cómo instalarlo, cómo configurarlo con `forRootAsync()`, ejemplos de uso de guards y decoradores, y cómo implementar las interfaces requeridas.

---

## Stack Tecnológico

| Capa | Herramienta |
|---|---|
| Framework | NestJS + TypeScript |
| Bundler | tsup |
| Package manager | pnpm workspaces |
| Registro privado | GitHub Packages |
| Testing | Jest |
| Base de datos (en apps consumidoras) | PostgreSQL + Prisma |

## Estructura del Repositorio

```
@tuorg/lib
  /packages
    /auth       → Módulo NestJS de autenticación (JWT + Passport)
    /payments   → Módulo NestJS de pagos (Stripe + MercadoPago)
  package.json  ← pnpm workspace root
```

## Decisiones Técnicas Tomadas

### Arquitectura de los paquetes
- **Dynamic Modules**: cada paquete expone `forRootAsync()` para ser configurable por el proyecto consumidor.
- **Abstract Repository Pattern**: los paquetes definen interfaces de acceso a datos; el proyecto consumidor provee la implementación (Prisma, TypeORM, etc.). Los paquetes no tienen dependencia directa de ninguna ORM.
- **Sin paquete `db`**: cada proyecto maneja su propia base de datos. Los paquetes son agnósticos al ORM.

### Tooling
- **Sin Turborepo**: innecesario para 2 paquetes y 1 desarrollador.
- **Sin Changesets**: versionado manual en `package.json` es suficiente para uso personal.
- **Publicación**: GitHub Actions publica automáticamente a GitHub Packages al hacer push de un tag.

### Paquetes
- `@agelormini2024/auth`: autenticación con JWT + Passport. Guards, decoradores y estrategias listos para usar.
- `@agelormini2024/payments`: integración con Stripe y MercadoPago. Agnóstico al proyecto.

### Scope y publicación
- GitHub user: `agelormini2024`
- Scope de los paquetes: `@agelormini2024`
- Registro: GitHub Packages (`https://npm.pkg.github.com`)

---

## Fases del Proyecto

- [x] **Fase 1** — Scaffold del monorepo (workspace, tsup, tsconfig base, estructura de carpetas)
- [x] **Fase 2** — Paquete `@agelormini2024/auth`
- [x] **Fase 3** — Paquete `@agelormini2024/payments`
- [x] **Fase 4** — Pipeline de publicación a GitHub Packages (GitHub Actions)
