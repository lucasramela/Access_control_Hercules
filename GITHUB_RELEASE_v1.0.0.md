# Publicacion en GitHub - v1.0.0

Esta carpeta esta lista para publicarse como version `v1.0.0` del sistema Hercules Gym.

## Antes de publicar

- Confirmar que `gym_access.db` no aparezca en los cambios.
- Confirmar que `node_modules/` no aparezca en los cambios.
- Confirmar que no haya archivos `.env` reales.
- El archivo `.env.example` si debe subirse, porque solo contiene nombres de variables de ejemplo.

## Archivos importantes de la version

- `README.md`
- `RELEASE_NOTES_v1.0.0.md`
- `package.json`
- `package-lock.json`
- `server.js`
- `src/`
- `public/`
- `vite.config.mjs`
- `iniciar_sistema.bat`
- `INSTRUCTIVO_TRASLADO.md`
- `.gitignore`
- `.env.example`

## Opcion A: GitHub Desktop

1. Abrir GitHub Desktop.
2. Ir a `File > Add local repository`.
3. Seleccionar esta carpeta:

```text
C:\Users\lucas\OneDrive\53- HERCULES\00- SISTEMA\HerculesGym_para_llevar_2026-04-30_1800
```

4. Si GitHub Desktop pregunta, crear el repositorio local.
5. Revisar la lista de archivos antes del commit.
6. Asegurarse de que NO esten:
   - `gym_access.db`
   - `node_modules/`
   - `.env`
7. Commit:

```text
Release v1.0.0
```

8. Publicar el repositorio con `Publish repository`.
9. Crear tag/release `v1.0.0` desde GitHub o GitHub Desktop.

## Opcion B: PowerShell con Git instalado

Cuando `git --version` funcione en PowerShell:

```powershell
cd "C:\Users\lucas\OneDrive\53- HERCULES\00- SISTEMA\HerculesGym_para_llevar_2026-04-30_1800"
git init
git add .
git status
git commit -m "Release v1.0.0"
git branch -M main
git tag v1.0.0
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main --tags
```

## Verificacion local

Antes de publicar se valido:

```powershell
npm.cmd run build:front
npm.cmd run check
```
