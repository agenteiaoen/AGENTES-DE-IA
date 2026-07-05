# 💇‍♀️ ZubAL Estilistas - Recepcionista Virtual

Un bot automático de Telegram que gestiona citas para ZubAL Estilistas. Reserva, modifica y cancela citas verificando disponibilidad real en Google Calendar.

## ✨ Características

- 📅 **Reservar citas** - El cliente dice su nombre y qué necesita en texto libre (ej. "un tinte"), y elige día/hora de una lista
- 🔎 **Ver mis citas** - Lista de citas reservadas
- ✏️ **Modificar cita** - Cambiar fecha/hora de una cita
- ❌ **Cancelar cita** - Anular reserva si hay imprevisto
- 🔒 **Seguridad** - Cada cliente solo puede tocar sus propias citas
- ✨ **Mensajes amables** - Tono cercano con emojis
- 🗓️ **Google Calendar integrado** - Fuente de verdad para disponibilidad

## 🚀 Instalación rápida

### 1. Clonar/descargar este proyecto

```bash
cd C:\Users\oscar\OneDrive\Desktop\Agente IA - Recepcionista\zubal-recepcionista
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Telegram Bot

Ve a Telegram y habla con [@BotFather](https://t.me/botfather):

1. Envía `/newbot`
2. Dale un nombre (ej: "ZubAL Recepcionista")
3. Dale un username (ej: `@AgenteIA_Recepcionista_bot`)
4. **Copia el token** que te devuelve

### 4. Configurar Google Calendar

Sigue los pasos en `docs/google-calendar-setup.md` para:
- Crear una cuenta de servicio en Google Cloud
- Compartir el calendario del negocio con esa cuenta
- Obtener las credenciales necesarias

### 5. Crear archivo `.env`

Basándote en `.env.example`, crea un `.env` real:

```bash
TELEGRAM_BOT_TOKEN=tu_token_aqui
GOOGLE_CLIENT_EMAIL=tu_email_de_servicio@tu_proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=tu_calendario_id@google.com
PORT=3000
```

### 6. Arrancar el bot

```bash
npm start
```

O en modo desarrollo (reinicia al guardar):

```bash
npm run dev
```

## 📁 Estructura del proyecto

```
zubal-recepcionista/
├── package.json          # Dependencias
├── .env.example          # Template de variables de entorno
├── .gitignore
├── README.md
└── src/
    ├── index.js          # Punto de entrada del bot
    ├── config.js         # ⭐ EDITAR AQUÍ: servicios, horarios, nombre
    ├── providers/
    │   └── telegramProvider.js    # Integración Telegram
    ├── bot/
    │   └── conversation.js        # Flujo de conversación
    └── calendar/
        └── googleCalendar.js      # Integración Google Calendar
```

## ⚙️ Configuración personalizada

### Cambiar servicios

Edita `src/config.js` y actualiza el array `services`:

```javascript
services: [
  { id: 'corte', nombre: '✂️ Corte de Cabello', duracionMin: 30, aliases: ['corte', 'cortar', 'pelo'] },
  { id: 'tinte', nombre: '🎨 Tinte', duracionMin: 60, aliases: ['tinte', 'teñir', 'color'] },
  // Añade los tuyos aquí
],
```

`aliases` son las palabras que el cliente puede escribir en texto libre para pedir ese servicio (el bot ya no usa botones para esto, entiende frases como "quiero un tinte").

### Cambiar horario laboral

En `src/config.js`, actualiza `businessHours`:

```javascript
businessHours: {
  1: [[10, 20]], // lunes 10:00-20:00
  2: [[10, 20]], // martes 10:00-20:00
  // ... etc
  6: [[10, 14]], // sábado 10:00-14:00
  // 0 (domingo) no aparece = cerrado
},
```

### Cambiar nombre del negocio

En `src/config.js`:

```javascript
businessName: 'ZubAL Estilistas ✨',
```

## 🔒 Seguridad

- **Un cliente solo puede ver/modificar sus propias citas** - Esto está garantizado porque cada evento de Google Calendar guarda el `clientId` de Telegram en propiedades privadas.
- **Las claves nunca se commitean** - `.env` está en `.gitignore`
- **Verificación de disponibilidad en tiempo real** - Usa `freebusy.query` de Google Calendar para evitar dobles reservas

## 🚀 Deployar en la nube

El bot está preparado para deployarse en:

- **Railway** - Cero config, push-to-deploy
- **Render** - Similar a Railway
- **VPS** - Con PM2 o similar para mantener el proceso vivo

### Deployment a Railway

1. Crea cuenta en [railway.app](https://railway.app)
2. Conecta tu repositorio GitHub
3. En proyecto → Variables, añade las de `.env`
4. ¡Listo! El bot se despliega automáticamente

## 📞 Soporte

Si algo no funciona:

1. **Bot no responde** - Verifica que el token en `.env` sea correcto
2. **No se agregan citas** - Comprueba las credenciales de Google Calendar
3. **Citas duplicadas** - No debería pasar, pero si pasa, revisa que Google Calendar esté correctamente compartido

## 📚 Documentación completa

- [Google Calendar Setup](docs/google-calendar-setup.md)
- [Telegram Bot Setup](docs/telegram-setup.md)
- [Conversation Flow](docs/conversation-flow.md)
- [Deployment Guide](docs/deployment.md)

---

Hecho con ❤️ para ZubAL Estilistas 💇‍♀️✨
