# 📅 Configuración de Google Calendar

AgendeX necesita acceso a Google Calendar de ZubAL Estilistas para leer disponibilidad y crear citas. Aquí te explicamos cómo configurarlo.

## Paso 1: Crear un proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Si es la primera vez, crea una cuenta
3. Haz clic en **"Crear proyecto"** (arriba a la izquierda)
4. Dale un nombre (ej: "AgendeX ZubAL")
5. Espera a que se cree (1-2 minutos)

## Paso 2: Activar Google Calendar API

1. En el menú lateral, busca **"APIs y servicios"** → **"Biblioteca"**
2. Busca **"Google Calendar API"**
3. Haz clic y selecciona **"Habilitar"**

## Paso 3: Crear una cuenta de servicio

1. Ve a **"APIs y servicios"** → **"Credenciales"**
2. Haz clic en **"Crear credenciales"** → **"Cuenta de servicio"**
3. Rellena:
   - Nombre: "zubal-recepcionista"
   - ID: "zubal-recepcionista" (se rellena solo)
4. Continúa sin rellenar más cosas (no necesita permisos especiales aquí)
5. Haz clic en **"Crear y continuar"** → **"Continuar"** (dos veces)

## Paso 4: Generar las claves

1. De vuelta en **"Credenciales"**, busca la cuenta de servicio que acabas de crear
2. Haz clic en el **email** de la cuenta (algo como `zubal-recepcionista@tu-proyecto.iam.gserviceaccount.com`)
3. Ve a la pestaña **"Claves"**
4. Haz clic en **"Añadir clave"** → **"Crear clave nueva"**
5. Elige **"JSON"** y descargalo
6. Te bajará un archivo `tu-proyecto-xxxxx.json`

## Paso 5: Extraer credenciales del JSON

Abre el archivo JSON que descargaste. Busca:

- `"client_email"` - Copiar valor completo
- `"private_key"` - Copiar valor completo (con el `\n` incluido)

## Paso 6: Compartir Google Calendar con la cuenta de servicio

1. Ve a [Google Calendar](https://calendar.google.com/)
2. Busca el calendario de ZubAL (o crea uno nuevo si no existe)
3. Haz clic derecho en el calendario → **"Configuración y opciones"** → **"Configuración"**
4. Ve a la pestaña **"Compartir con mis contactos"**
5. Haz clic en **"Compartir con personas específicas"**
6. Añade el email de la cuenta de servicio (del paso 4, el que pone `iam.gserviceaccount.com`)
7. Dale permisos de **"Puede crear y editar eventos"**
8. Guarda

## Paso 7: Obtener el ID del calendario

En Google Calendar:
1. Busca el calendario de ZubAL
2. Haz clic en los 3 puntos → **"Configuración"**
3. Busca **"ID de calendario"** (algo como `xxxx@group.calendar.google.com`)
4. Cópialo

## Paso 8: Llenar `.env`

Ahora tienes todo. Abre `.env` y rellena:

```env
GOOGLE_CLIENT_EMAIL=zubal-recepcionista@tu-proyecto.iam.gserviceaccount.com
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
