# Hercules Gym - Sistema de control de acceso

Aplicacion web local para registrar clientes, controlar cuotas, cobrar planes, administrar finanzas y validar ingreso por DNI.

## Requisitos

- Windows
- Node.js 22 o superior
- Navegador web actualizado

## Tecnologia

- Backend: Node.js con `http` nativo.
- Base de datos: SQLite local en `gym_access.db`.
- Frontend: Svelte + Vite.
- Archivos compilados del frontend: `public/dist/`.
- Codigo fuente del frontend: `src/`.

## Ejecutar

Opcion simple:

```text
Doble clic en iniciar_sistema.bat
```

Opcion manual desde esta carpeta:

```powershell
node server.js
```

Luego abrir:

- Pantalla de acceso para clientes: http://localhost:3000 o http://localhost:3000/login
- Panel administrativo: http://localhost:3000/admin

Usuario administrador inicial:

- Usuario: `admin`
- Clave: `admin123`

Usuario recepcion inicial:

- Usuario: `recepcion`
- Clave: `recepcion123`

Se puede cambiar con variables de entorno:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="otra-clave"
node server.js
```

El sistema usa la base SQLite `gym_access.db`. Ese archivo guarda clientes, pagos, accesos, planes, finanzas y personal.

Si se ejecuta por primera vez sin base de datos, el sistema crea automaticamente `gym_access.db` y un cliente demo:

- DNI: `30111222`

## Llevar a otra PC

Ver el archivo:

```text
INSTRUCTIVO_TRASLADO.md
```

Resumen rapido:

1. Copiar completa la carpeta del proyecto.
2. Instalar Node.js 22 o superior en la otra PC.
3. Ejecutar `iniciar_sistema.bat`.
4. Abrir `http://localhost:3000/login` o `http://localhost:3000/admin`.

Importante: copiar tambien `gym_access.db` para llevar los datos actuales.

## Modificar el frontend Svelte

Si se modifica algo dentro de `src/`, recompilar antes de usar el sistema:

```powershell
npm install
npm run build:front
node server.js
```

El sistema servido por `node server.js` usa los archivos compilados en `public/dist/`.

## Datos de clientes

Campos obligatorios:

- Nombre
- Apellido
- DNI
- Celular
- Email
- Fecha de mensualidad pagada hasta

Campos opcionales:

- Direccion
- Peso
- Estatura
- Fecha de nacimiento

## API preparada para molinete

El punto de integracion para un molinete, relay o controlador externo es:

```http
POST /api/access/validate
Content-Type: application/json

{
  "dni": "30111222",
  "source": "turnstile-1"
}
```

Respuesta cuando el acceso esta permitido:

```json
{
  "ok": true,
  "status": "granted",
  "message": "Acceso correcto.",
  "actuator": {
    "command": "unlock",
    "ttlMs": 3500
  }
}
```

Respuesta cuando debe bloquearse:

```json
{
  "ok": false,
  "status": "denied",
  "message": "DNI no registrado.",
  "actuator": {
    "command": "deny",
    "ttlMs": 0
  }
}
```

Cada intento queda guardado en `access_events`.

## Pantallas principales

La pantalla de clientes esta pensada para una PC en la entrada con teclado numerico. No muestra enlaces administrativos.

El panel administrativo se abre por separado en `/admin` y cuenta con login, dashboard, CRUD de clientes, ficha digital, ultimos accesos, vencimientos, alertas, finanzas, planes y personal.

## Alertas por WhatsApp

La pestaña `Alertas` detecta socios activos cuya cuota vence en los proximos 7 dias y genera acciones para WhatsApp Web con el mensaje prearmado.

Para envio automatico real sin intervencion humana hace falta configurar un proveedor externo, por ejemplo WhatsApp Business API, Twilio o Meta Cloud API.

## Version 1.0.0 y GitHub

El proyecto esta preparado para subir a GitHub como version `v1.0.0`.

Archivos que no deben subirse:

- `node_modules/`
- `gym_access.db`
- `.env`
- backups de base de datos
- ZIPs de traslado

Estos archivos ya estan contemplados en `.gitignore`.

Cuando Git este disponible en PowerShell:

```powershell
git init
git add .
git commit -m "Release v1.0.0"
git branch -M main
git tag v1.0.0
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main --tags
```

Con GitHub Desktop:

1. File > Add local repository.
2. Elegir esta carpeta del proyecto.
3. Create repository si lo pide.
4. Revisar que `gym_access.db` no aparezca en los cambios.
5. Commit: `Release v1.0.0`.
6. Publish repository.
