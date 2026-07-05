# 💇‍♀️ AgendeX - Asistente virtual de ZubAL Estilistas

**AgendeX** es el asistente virtual por Telegram que gestiona citas para ZubAL Estilistas. Reserva, modifica y cancela citas verificando disponibilidad real en Google Calendar.

## ✨ Características

- 📅 **Reservar citas** - Conversación 100% en lenguaje natural (sin botones): el cliente dice su nombre, qué necesita y cuándo le viene bien, tal cual escribiría por WhatsApp
- 🧠 **Motor conversacional con IA** - Google Gemini entiende la conversación y decide qué consultar en el calendario (ver `docs/conversation-flow.md`)
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
2. Dale el nombre "AgendeX"
3. Dale un username (ej: `@AgenteIA_Recepcionista_bot`)
4. **Copia el token** que te devuelve

### 4. Configurar Google Calendar

Sigue los pasos en `docs/google-calendar-setup.md` para:
- Crear una cuenta de servicio en Google Cloud
- Compartir el calendario del negocio con esa cuenta
- Obtener las credenciales necesarias

### 5. Conseguir una API key de Google Gemini

Entra en **https://aistudio.google.com/app/apikey**, inicia sesión con tu cuenta de Google y pulsa "Create API key". Es gratis para este volumen de uso.

### 6. Crear archivo `.env`

Basándote en `.env.example`, crea un `.env` real:

```bash
TELEGRAM_BOT_TOKEN=tu_token_aqui
GEMINI_API_KEY=tu_api_key_de_gemini
GOOGLE_CLIENT_EMAIL=tu_email_de_servicio@tu_proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=tu_calendario_id@google.com
PORT=3000
```

### 7. Arrancar el bot

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
    │   ├── conversation.js        # Punto de entrada de cada mensaje
    │   ├── aiAgent.js             # Motor conversacional (Gemini + system prompt)
    │   └── tools.js               # Funciones que la IA puede llamar (calendario)
    └── calendar/
        └── googleCalendar.js      # Integración Google Calendar
```

## ⚙️ Configuración personalizada

### Cambiar servicios

Edita `src/config.js` y actualiza el array `services`:

```javascript
services: [
  { id: 'corte', nombre: '✂️ Corte de Cabello', duracionMin: 30 },
  { id: 'tinte', nombre: '🎨 Tinte', duracionMin: 60 },
  // Añade los tuyos aquí
],
```

No hace falta ninguna lista de alias ni palabras clave: el agente de IA recibe esta lista tal cual en su system prompt (`aiAgent.js`) y entiende frases como "quiero un tinte" sin configuración extra.

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

- **Un cliente solo puede ver/modificar sus propias citas** - Esto está garantizado porque cada evento de Google Calendar guarda el `clientId` de Telegram en propiedades privadas, y el `clientId` nunca se le pasa al modelo de IA como parámetro (va vinculado por clausura en `tools.js`), así que ni un mensaje manipulador puede hacer que toque la cita de otro cliente.
- **Las claves nunca se commitean** - `.env` está en `.gitignore`
- **Verificación de disponibilidad en tiempo real** - Usa `freebusy.query` de Google Calendar para evitar dobles reservas
- **El bot no da información fuera de tema** - El system prompt de `aiAgent.js` lo limita estrictamente a agendar/ver/cancelar/modificar citas de este negocio
- **Identidad clara** - AgendeX se identifica con ese nombre si el cliente pregunta, sin fingir ser otra cosa

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
2. **Bot responde con error genérico a todo** - Casi siempre es que falta o es inválida `GEMINI_API_KEY`
3. **No se agregan citas** - Comprueba las credenciales de Google Calendar
4. **Citas duplicadas** - No debería pasar, pero si pasa, revisa que Google Calendar esté correctamente compartido

## 📚 Documentación completa

- [Google Calendar Setup](docs/google-calendar-setup.md)
- [Telegram Bot Setup](docs/telegram-setup.md)
- [Conversation Flow](docs/conversation-flow.md)
- [Deployment Guide](docs/deployment.md)

---

AgendeX, hecho con ❤️ para ZubAL Estilistas 💇‍♀️✨
