# Despliegue en DonWeb con dominio

Dominio objetivo:

```text
herculesgym.com.ar
```

## Hosting recomendado

Este sistema corre con Node.js y SQLite. Para publicarlo en DonWeb conviene usar un plan con soporte Node.js, por ejemplo Cloud Node.js Hosting o Cloud Server con Node, NPM, PM2, Nginx y Certbot.

No conviene usar un hosting compartido PHP tradicional si no permite ejecutar procesos Node.js permanentes.

## Variables de entorno de produccion

Configurar claves reales, no usar las de ejemplo:

```env
NODE_ENV=production
COOKIE_SECURE=true
PORT=3000
ADMIN_USER=admin
ADMIN_PASSWORD=CAMBIAR_CLAVE_ADMIN_SEGURA
RECEPTION_USER=recepcion
RECEPTION_PASSWORD=CAMBIAR_CLAVE_RECEPCION_SEGURA
```

## Pasos generales

1. Crear el servicio Node.js en DonWeb.
2. Clonar el repositorio desde GitHub.
3. Instalar dependencias:

```bash
npm install
```

4. Compilar frontend:

```bash
npm run build:front
```

5. Iniciar con PM2 o el panel del hosting:

```bash
npm start
```

6. Configurar Nginx/proxy para apuntar el dominio al puerto de Node.
7. Activar SSL/HTTPS para `herculesgym.com.ar`.
8. Verificar que las cookies viajen con `Secure` y que el sitio abra por `https://`.

## Seguridad aplicada en la app

- Cookies `HttpOnly`, `SameSite=Strict` y `Secure` en produccion.
- Headers de seguridad:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Content-Security-Policy`
  - `Strict-Transport-Security` cuando `COOKIE_SECURE=true`
- Exportacion, backups y restauracion solo para perfil administrador.

## Backups

Desde el modulo Caja, el administrador puede descargar una copia ZIP del sistema completo, incluida la base `gym_access.db`.

Para restaurar:

1. Entrar como administrador.
2. Ir a Caja.
3. Subir el ZIP de backup en Restaurar backup.
4. Reiniciar el servidor Node.js.

Antes de aplicar una restauracion, el sistema guarda una copia previa en `backups/`.
