# Consumir paquetes privados de GitHub Packages en producción (Render/Vercel)

Guía para instalar paquetes privados en entornos de deploy como Render y Vercel.

---

## 1. ¿Por qué es necesario el PAT?

- Cuando tu proyecto depende de paquetes privados en GitHub Packages, el entorno de deploy necesita autenticarse para poder descargarlos.
- El Personal Access Token (PAT) debe tener el scope `read:packages`.

---

## 2. ¿Cuándo se usa el PAT?

- Siempre que el entorno de deploy ejecuta `pnpm install` o `npm install`.
- No es necesario para ejecutar la app ya instalada, solo para descargar dependencias.

---

## 3. Configuración en Render

1. Entrá a tu servicio en Render.
2. En la sección **Environment**, agregá una variable:
   - **Key:** `NODE_AUTH_TOKEN`
   - **Value:** (tu PAT con `read:packages`)
3. Asegurate de tener el archivo `.npmrc` en la raíz del proyecto:
   ```ini
   @agelormini2024:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```
4. Render usará ese token automáticamente en el build.

---

## 4. Configuración en Vercel

1. Entrá a tu proyecto en Vercel.
2. Ir a **Settings > Environment Variables**.
3. Agregá una variable:
   - **Name:** `NODE_AUTH_TOKEN`
   - **Value:** (tu PAT con `read:packages`)
   - **Environment:** Production y/o Preview
4. Asegurate de tener el archivo `.npmrc` en la raíz del proyecto:
   ```ini
   @agelormini2024:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```
5. Vercel usará ese token automáticamente en el build.

---

## 5. Seguridad

- El PAT debe tener solo el scope `read:packages`.
- No uses un PAT con permisos de escritura en entornos de deploy.
- Nunca subas el token al código ni lo hardcodees en el repo.

---

## 6. Resumen visual

| Plataforma | Dónde poner el PAT         | Archivo necesario | ¿Cuándo se usa?           |
|------------|---------------------------|-------------------|---------------------------|
| Render     | Environment Variable      | .npmrc            | En cada build/deploy      |
| Vercel     | Environment Variable      | .npmrc            | En cada build/deploy      |

---

## 7. Notas finales

- El token solo se usa para instalar dependencias en el build, no queda expuesto en la app final.
- Si tu build copia los node_modules y no vuelve a instalar, no vuelve a pedir el token.
- Si tenés dudas, revisá los logs de build en Render/Vercel para ver si hay errores de autenticación.
