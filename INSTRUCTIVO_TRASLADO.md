# Instructivo para llevar el sistema a otra PC

Este sistema funciona como una aplicacion web local. Se copia la carpeta completa, se instala Node.js en la nueva PC y se ejecuta el servidor.

## 1. Que copiar

Copiar completa esta carpeta:

```text
HerculesGym_para_pendrive_2026-04-30_0144
```

Debe incluir, como minimo:

- `server.js`
- `package.json`
- `package-lock.json`
- `gym_access.db`
- `public/`
- `src/`
- `iniciar_sistema.bat`

Importante: `gym_access.db` es la base de datos. Ahi estan guardados clientes, accesos, pagos, planes, finanzas y personal. Si no se copia ese archivo, la otra PC arrancara sin los datos actuales.

No hace falta copiar `node_modules`. Esa carpeta se puede reconstruir en la otra PC con `npm install`.

## 2. Instalar Node.js en la nueva PC

Instalar Node.js version 22 o superior.

Version recomendada:

```text
Node.js 22.18.0 o superior
```

Para comprobar la instalacion, abrir PowerShell y ejecutar:

```powershell
node --version
```

Debe mostrar una version similar a:

```text
v22.18.0
```

## 3. Pegar la carpeta en la nueva PC

Ejemplo recomendado:

```text
C:\HerculesGym\HerculesGym_para_pendrive_2026-04-30_0144
```

Tambien puede estar en Escritorio o Documentos. Si la ruta tiene espacios, abrirla desde el Explorador de Windows y usar doble clic en `iniciar_sistema.bat`.

## 4. Iniciar el sistema

Opcion simple:

1. Entrar a la carpeta del sistema.
2. Hacer doble clic en `iniciar_sistema.bat`.
3. Dejar abierta la ventana negra mientras se usa el sistema.

Opcion manual desde PowerShell:

```powershell
cd "C:\HerculesGym\HerculesGym_para_pendrive_2026-04-30_0144"
node server.js
```

Si todo esta bien, deberia aparecer:

```text
Sistema de acceso listo en http://localhost:3000
```

## 5. Abrir las pantallas

En la misma PC:

- Login de clientes: `http://localhost:3000/login`
- Panel administrativo: `http://localhost:3000/admin`

Usuario administrador inicial:

- Usuario: `admin`
- Clave: `admin123`

## 6. Usarlo desde otra PC de la misma red

Si el servidor queda corriendo en una PC principal, otras PCs de la misma red pueden entrar usando la IP de esa PC.

Ejemplo:

```text
http://192.168.1.50:3000/login
http://192.168.1.50:3000/admin
```

Para ver la IP de la PC principal:

```powershell
ipconfig
```

Buscar la linea `IPv4`.

Si no abre desde otra PC, revisar el Firewall de Windows y permitir Node.js o abrir el puerto `3000`.

## 7. Cambiar usuario y clave de administrador

Antes de iniciar el sistema se pueden definir credenciales distintas:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="nueva-clave"
node server.js
```

Si se usa `iniciar_sistema.bat`, se puede editar ese archivo y cambiar estas lineas:

```bat
set ADMIN_USER=admin
set ADMIN_PASSWORD=admin123
```

## 8. Hacer backup

Para hacer una copia de seguridad, cerrar el sistema y copiar este archivo:

```text
gym_access.db
```

Ejemplo de nombre recomendado:

```text
gym_access_backup_2026-04-29.db
```

Conviene guardar backups en un pendrive, disco externo o nube.

## 9. Actualizar el sistema en otra PC sin perder datos

Si mas adelante se actualizan archivos del sistema:

1. Cerrar el sistema.
2. Hacer backup de `gym_access.db`.
3. Copiar los archivos nuevos.
4. No pisar `gym_access.db` si se quiere conservar la informacion de esa PC.
5. Volver a ejecutar `iniciar_sistema.bat`.

## 10. Seguir desarrollando en casa

Si vas a seguir tocando el sistema en la PC de tu casa:

1. Abrir PowerShell en la carpeta del proyecto.
2. Instalar dependencias:

```powershell
npm install
```

3. Luego de modificar archivos dentro de `src/`, recompilar el frontend:

```powershell
npm.cmd run build:front
```

4. Iniciar el sistema:

```powershell
npm start
```

Tambien se puede iniciar con doble clic en `iniciar_sistema.bat`.

## 11. Notas importantes

- Para usar el sistema ya compilado no hace falta ejecutar `npm install`, siempre que esten incluidos `public/dist/admin.js` y `public/dist/login.js`.
- El frontend esta hecho en Svelte. Si solo se va a usar el sistema, alcanza con ejecutar `iniciar_sistema.bat` porque ya estan incluidos los archivos compilados en `public/dist/`.
- Si se modifica el frontend dentro de `src/`, ejecutar `npm install` y luego `npm run build:front` antes de iniciar el sistema.
- La PC que corre `server.js` debe quedar encendida para que el login y el panel funcionen.
- Para una instalacion definitiva conviene configurar inicio automatico de Windows o dejar un acceso directo a `iniciar_sistema.bat`.
- Para integracion futura con molinetes, el endpoint principal es `POST /api/access/validate`.
