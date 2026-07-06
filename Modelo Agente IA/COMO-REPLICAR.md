# 📋 Cómo replicar este agente para un negocio nuevo

Guía paso a paso para convertir esta plantilla en el recepcionista virtual de un negocio concreto.

## Paso 1: Copiar la carpeta

Duplica toda la carpeta `Modelo Agente IA` y ponle un nombre sin espacios ni acentos, en minúsculas, describiendo el negocio:

```
mi-negocio-bot/
clinica-dental-bot/
taller-mecanico-bot/
```

(Los espacios en el nombre de carpeta complican el despliegue y algunos comandos — evítalos en la copia, aunque esta plantilla sí los tenga.)

## Paso 2: Editar `src/config.js`

Es el **único archivo que necesitas tocar**. Rellena:

- `businessName`: nombre tal como lo verá el cliente
- `timezone`: zona horaria del negocio (formato IANA)
- `services`: lista de servicios con su duración en minutos (el agente de IA los entiende en lenguaje natural directamente, no hace falta ninguna lista de alias)
- `businessHours`: horario de apertura por día de la semana
- `daysAhead`, `slotStepMin`, `maxCitasPorCliente`: ajustes opcionales, los valores por defecto sirven para la mayoría de negocios

No hace falta tocar `conversation.js`, `aiAgent.js`, `tools.js` ni `googleCalendar.js` — todo lo que cambia entre negocios pasa por `config.js`.

## Paso 3: Crear el bot de Telegram

Sigue `docs/telegram-setup.md`. Al final tendrás un `TELEGRAM_BOT_TOKEN`.

## Paso 4: Conseguir una API key de Google Gemini

Entra en https://aistudio.google.com/app/apikey, inicia sesión y pulsa "Create API key". Es el motor que lleva la conversación — sin esta clave el bot no puede responder.

## Paso 5: Configurar Google Calendar

Sigue `docs/google-calendar-setup.md`. Al final tendrás:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`

## Paso 6: Crear el `.env` local

Copia `.env.example` a `.env` y rellena las variables de los pasos 3, 4 y 5. Deja `PUBLIC_URL` vacía para probar en local.

## Paso 7: Probar en local

```bash
npm install
npm start
```

Escribe `/start` al bot en Telegram y comprueba:
- Que el saludo menciona el nombre correcto del negocio
- Que puedes decir tu nombre y qué servicio quieres en una frase natural (ej. "soy Juan y quiero el servicio de ejemplo 1") y el bot lo entiende sin necesidad de escribir el nombre exacto del servicio
- Que los huecos ofrecidos respetan el horario que pusiste
- Que se crea el evento en el Google Calendar correcto

## Paso 8: Desplegar 24/7 gratis

Sigue `docs/deployment.md`. Resumen:
1. Sube el proyecto a GitHub
2. Edita `render.yaml`: `name` (nombre del servicio) y `rootDir` (ruta a esta carpeta si está dentro de un repo con más proyectos)
3. Ve a `render.com/deploy?repo=...` y sigue el asistente
4. Rellena las variables de entorno (las mismas del `.env`, más `PUBLIC_URL` con la URL que te dé Render)

## Paso 9: Verificar producción

```
https://tu-servicio.onrender.com/health   → debe devolver "ok"
https://api.telegram.org/bot<TOKEN>/getWebhookInfo   → "url" debe apuntar a tu Render
```

## ✅ Checklist final

- [ ] `config.js` tiene el negocio, servicios y horario correctos
- [ ] Bot de Telegram creado y probado en local
- [ ] `GEMINI_API_KEY` configurada y probada en local
- [ ] Google Calendar compartido con la cuenta de servicio
- [ ] `.env` completo en local, nunca subido a git
- [ ] Desplegado en Render con `render.yaml` actualizado
- [ ] `/health` y `getWebhookInfo` verificados en producción

## 🎨 Personalizar el tono (opcional)

Si quieres que el bot suene distinto (más formal, con emojis diferentes, otro idioma), el system prompt está en `src/bot/aiAgent.js` (función `buildSystemInstruction`). No afecta a la lógica de citas — solo cambia cómo se expresa.

## ⚠️ Qué NO cambiar salvo que sepas por qué

- El filtro `privateExtendedProperty` en `googleCalendar.js` — es lo que impide que un cliente vea o cancele la cita de otro. Nunca lo quites para "simplificar" el código.
- El `clientId` en `tools.js` (`createToolExecutor`) — está vinculado por clausura y nunca debe convertirse en un parámetro que el modelo de IA pueda rellenar, o cualquier cliente podría acceder a las citas de otro.
- La comprobación `isSlotStillFree` justo antes de crear/mover una cita — evita que dos clientes reserven el mismo hueco a la vez.
- El manejo de errores en `telegramProvider.js` (los `try/catch` alrededor de `onMessage`) — sin ellos, un fallo de Google Calendar o de Gemini puede tirar todo el proceso.
