# 📅 Configuración de Google Calendar

Este bot necesita acceso a un Google Calendar del negocio para leer disponibilidad y crear citas. Aquí te explicamos cómo configurarlo.

## Paso 1: Crear un proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Si es la primera vez, crea una cuenta
3. Haz clic en **"Crear proyecto"** (arriba a la izquierda)
4. Dale un nombre (ej: "Mi Negocio Recepcionista")
5. Espera a que se cree (1-2 minutos)

## Paso 2: Activar Google Calendar API

1. En el menú lateral, busca **"APIs y servicios"** → **"Biblioteca"**
2. Busca **"Google Calendar API"**
3. Haz clic y selecciona **"Habilitar"**

## Paso 3: Crear una cuenta de servicio

1. Ve a **"APIs y servicios"** → **"Credenciales"**
2. Haz clic en **"Crear credenciales"** → **"Cuenta de servicio"**
3. Rellena un nombre descriptivo (ej: "mi-negocio-recepcionista")
4. Continúa sin rellenar más cosas (no necesita permisos especiales aquí)
5. Haz clic en **"Crear y continuar"** → **"Continuar"** (dos veces)

## Paso 4: Generar las claves

1. De vuelta en **"Credenciales"**, busca la cuenta de servicio que acabas de crear
2. Haz clic en el **email** de la cuenta (algo como `mi-negocio-recepcionista@tu-proyecto.iam.gserviceaccount.com`)
3. Ve a la pestaña **"Claves"**
4. Haz clic en **"Añadir clave"** → **"Crear clave nueva"**
5. Elige **"JSON"** y descargalo
6. Te bajará un archivo `tu-proyecto-xxxxx.json`

## Paso 5: Extraer credenciales del JSON

Abre el archivo JSON que descargaste. Busca:

- `"client_email"` - Copiar valor completo
- `"private_key"` - Copiar valor completo (con el `\n` incluido)

## Paso 6: Crear y compartir el calendario del negocio

La forma más práctica es dejar que la propia cuenta de servicio cree un calendario nuevo (vía API) y te lo comparta como propietario — así no dependes de la interfaz de Google Calendar para este paso. Si prefieres hacerlo manualmente:

1. Ve a [Google Calendar](https://calendar.google.com/)
2. Crea un calendario nuevo o usa uno existente
3. Clic en los 3 puntos → **"Configuración y uso compartido"**
4. En **"Compartir con determinadas personas"**, añade el email de la cuenta de servicio (el que termina en `iam.gserviceaccount.com`)
5. Dale permiso de **"Hacer cambios en los eventos"**

## Paso 7: Obtener el ID del calendario

1. En la misma pantalla de configuración, baja hasta **"Integrar calendario"**
2. Copia el **"ID de calendario"** (algo como `xxxx@group.calendar.google.com`)

## Paso 8: Llenar `.env`

Ahora tienes todo. Abre `.env` y rellena:

```env
GOOGLE_CLIENT_EMAIL=mi-negocio-recepcionista@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=xxxx@group.calendar.google.com
```

**Importante:** La `GOOGLE_PRIVATE_KEY` debe estar en una sola línea con `\n` para saltos (el JSON ya viene así).

## ¿Listo?

Si todo está bien, cuando arranques el bot debería conectarse sin problemas. Las citas se crearán automáticamente en Google Calendar y los clientes solo verán sus propias citas. 🎉

---

**Problemas comunes:**

- **"API not enabled"** - Vuelve al paso 2 y asegúrate de habilitar Google Calendar API
- **"Permission denied"** - Asegúrate de que compartiste el calendario con el email de la cuenta de servicio (paso 6)
- **"Invalid private key"** - Verifica que la `GOOGLE_PRIVATE_KEY` tenga los `\n` correctos (no espacios alrededor)
