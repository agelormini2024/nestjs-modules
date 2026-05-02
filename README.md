# @agelormini2024 — Módulos NestJS Reutilizables

Librería personal de módulos NestJS publicados como paquetes privados en GitHub Packages. El objetivo es poder instalarlos en cualquier proyecto nuevo con un simple `pnpm add` y evitar reescribir lógica común entre proyectos.

## Paquetes

| Paquete | Descripción | Versión |
|---|---|---|
| [`@agelormini2024/auth`](./packages/auth/README.md) | Autenticación con JWT + Passport. Guards, decoradores y estrategias listos para usar. | 0.1.0 |
| [`@agelormini2024/payments`](./packages/payments/README.md) | Integración con Stripe y MercadoPago. Ambos proveedores son opcionales. | 0.1.0 |

---

## Instalación en un proyecto consumidor

### 1. Configurar el registro de GitHub Packages

Agregá un archivo `.npmrc` en la raíz de tu proyecto con el siguiente contenido:

```ini
@agelormini2024:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Luego definí la variable de entorno `NODE_AUTH_TOKEN` con un Personal Access Token (PAT) de GitHub que tenga el scope `read:packages`.

### 2. Instalar los paquetes

```bash
# Solo autenticación
pnpm add @agelormini2024/auth

# Solo pagos
pnpm add @agelormini2024/payments

# Ambos
pnpm add @agelormini2024/auth @agelormini2024/payments
```

### 3. Consultar el README de cada paquete

Cada paquete tiene su propio README con ejemplos completos de configuración y uso:

- [Documentación de `@agelormini2024/auth`](./packages/auth/README.md)
- [Documentación de `@agelormini2024/payments`](./packages/payments/README.md)

---

## Desarrollo

### Requisitos

- Node.js 20+
- pnpm 9+

### Instalar dependencias

```bash
pnpm install
```

### Correr los tests

```bash
# Todos los paquetes
pnpm -r test

# Un paquete específico
pnpm --filter @agelormini2024/auth test
pnpm --filter @agelormini2024/payments test
```

### Build

```bash
# Todos los paquetes
pnpm -r build

# Un paquete específico
pnpm --filter @agelormini2024/auth build
```

---

## Publicación

Los paquetes se publican automáticamente a GitHub Packages mediante GitHub Actions cuando se hace push de un tag con formato `v*`.

### Pasos para publicar una nueva versión

1. Bumpeá la versión en los `package.json` de los paquetes que cambiaron:

```bash
# packages/auth/package.json
# packages/payments/package.json
```

2. Commiteá el cambio:

```bash
git add packages/auth/package.json packages/payments/package.json
git commit -m "chore: bump version to 0.2.0"
```

3. Creá y pusheá el tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

El workflow en `.github/workflows/publish.yml` se encarga del resto: corre los tests, hace el build y publica ambos paquetes.

---

## Estructura del repositorio

```
.
├── .github/
│   └── workflows/
│       └── publish.yml       ← CI/CD: publica en GitHub Packages al pushear un tag v*
├── packages/
│   ├── auth/                 ← @agelormini2024/auth
│   │   ├── src/
│   │   ├── README.md
│   │   ├── package.json
│   │   └── tsup.config.ts
│   └── payments/             ← @agelormini2024/payments
│       ├── src/
│       ├── README.md
│       ├── package.json
│       └── tsup.config.ts
├── package.json              ← workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json        ← configuración TypeScript base compartida
```

## Stack

| Capa | Herramienta |
|---|---|
| Framework | NestJS 10 + TypeScript |
| Bundler | tsup (CJS + ESM + tipos) |
| Package manager | pnpm workspaces |
| Registro | GitHub Packages |
| Testing | Jest 29 + ts-jest |
