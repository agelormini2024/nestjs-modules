# Publicar un paquete npm privado en GitHub Packages (automático con GitHub Actions)

Guía paso a paso para publicar un paquete usando CI/CD automático con GitHub Actions.

---

## 1. Preparar el paquete

1. Cambiá la versión en `packages/<paquete>/package.json` (ejemplo: de "0.1.1" a "0.2.0").
2. Hacé commit y push del cambio:

```bash
git add packages/<paquete>/package.json
git commit -m "chore(<paquete>): bump version to 0.2.0"
git push
```

---

## 2. Crear y pushear el tag de versión

```bash
git tag v0.2.0
git push origin v0.2.0
```

---

## 3. El workflow automático

- El workflow definido en `.github/workflows/publish.yml` se dispara automáticamente al pushear un tag que empieza con `v`.
- El workflow:
  1. Instala dependencias
  2. Corre los tests
  3. Hace el build
  4. Publica los paquetes en GitHub Packages usando el token automático (`GITHUB_TOKEN`)

---

## 4. Verificar la publicación

1. Entrá a la pestaña "Actions" en GitHub y mirá el workflow corriendo.
2. Cuando termine, verificá que la nueva versión esté publicada en GitHub Packages:
   - https://github.com/tu-usuario?tab=packages

---

## Notas
- No necesitás crear ni exportar ningún token manualmente para Actions, el workflow usa el `GITHUB_TOKEN` automático.
- Si el workflow falla, revisá los logs en la pestaña "Actions" para ver el motivo (tests, build, permisos, etc).
- Este flujo es el recomendado para proyectos serios y colaborativos.
