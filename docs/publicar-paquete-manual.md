# Publicar un paquete npm privado en GitHub Packages (manual)

Guía paso a paso para publicar un paquete desde tu máquina local en GitHub Packages usando pnpm.

---

## 1. Generar un Personal Access Token (PAT)

1. Ir a https://github.com/settings/tokens
2. Crear un nuevo token (classic) con los siguientes scopes:
   - `write:packages`
   - `read:packages`
   - (si el repo es privado) `repo`
3. Copiar y guardar el token en un lugar seguro.

---

## 2. Exportar el token como variable de entorno

En la terminal:

```bash
export NODE_AUTH_TOKEN=tu_token_generado
```

---

## 3. Cambiar la versión del paquete

Editar el archivo `packages/<paquete>/package.json` y modificar el campo `"version"`.

---

## 4. Build del paquete

Desde la raíz del monorepo:

```bash
pnpm --filter @agelormini2024/auth build
```

---

## 5. Commit de los cambios

Desde la raíz del repo:

```bash
git add .
git commit -m "build(auth): versión lista para publicar"
```

---

## 6. Publicar el paquete

Entrar a la carpeta del paquete:

```bash
cd packages/auth
```

Ejecutar:

```bash
pnpm publish --access=restricted
```

---

## 7. Verificar la publicación

Ir a https://github.com/tu-usuario?tab=packages y chequear que la nueva versión esté publicada.

---

## Notas
- Si ves errores de autenticación, revisá el token y que esté bien exportado.
- Si ves errores de git, asegurate de commitear los cambios antes de publicar.
- El warning de `.npmrc` es normal si la variable no está seteada, pero debe estarlo al publicar.
