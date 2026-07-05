# 📋 Cómo replicar este agente para un negocio nuevo

Guía paso a paso para convertir esta plantilla en el recepcionista virtual de un negocio concreto.

## Paso 1: Copiar la carpeta

Duplica toda la carpeta `Agente Modelo Recepcion` y ponle un nombre sin espacios ni acentos, en minúsculas, describiendo el negocio:

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
- `services`: lista de servicios con su duración en minutos y `aliases` (palabras que el cliente puede escribir en texto libre para pedir ese servicio, ej. "corte", "corte de pelo")
- `businessHours`: horario de apertura por día de la semana
- `daysAhead`, `slotStepMin`, `maxCitasPorCliente`: ajustes opcionales, los valores por defecto sirven para la mayoría de negocios

No hace falta tocar `conversation.js` ni `googleCalendar.js` — todo lo que cambia entre negocios pasa por `config.js`.

## Paso 3: Crear el bot de Telegram

Sigue `docs/telegram-setup.md`. Al final tendrás un `TELEGRAM_BOT_TOKEN`.

## Paso 4: Configurar Google Calendar

Sigue `docs/google-calendar-setup.md`. Al final tendrás:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`

## Paso 5: Crear el `.env` local

Copia `.env.example` a `.env` y rellena las 4 variables de los pasos 3 y 4. Deja `PUBLIC_URL` vacía para probar en local.

## Paso 6: Probar en local

```bash
npm install
npm start
```

Escribe `/start` al bot en Telegram y comprueba:
- Que el menú aparece con el nombre correcto del negocio
- Que "Reservar cita" te pregunta el nombre y luego reconoce el servicio al escribirlo en texto libre (prueba con el nombre completo y con un alias corto de los que configuraste)
- Que los huecos ofrecidos respetan el horario que pusiste
- Que se crea el evento en el Google Calendar correcto

## Paso 7: Desplegar 24/7 gratis

Sigue `docs/deployment.md`. Resumen:
1. Sube el proyecto a GitHub
2. Edita `render.yaml`: `name` (nombre del servicio) y `rootDir` (ruta a esta carpeta si está dentro de un repo con más proyectos)
3. Ve a `render.com/deploy?repo=...` y sigue el asistente
4. Rellena las variables de entorno (las mismas 4 del `.env`, más `PUBLIC_URL` con la URL que te dé Render)

## Paso 8: Verificar producción

```
https://tu-servicio.onrender.com/health   → debe devolver "ok"
https://api.telegram.org/bot<TOKEN>/getWebhookInfo   → "url" debe apuntar a tu Render
```

## ✅ Checklist final

- [ ] `config.js` tiene el negocio, servicios y horario correctos
- [ ] Bot de Telegram creado y probado en local
- [ ] Google Calendar compartido con la cuenta de servicio
- [ ] `.env` completo en local, nunca subido a git
- [ ] Desplegado en Render con `render.yaml` actualizado
- [ ] `/health` y `getWebhookInfo` verificados en producción

## 🎨 Personalizar el tono (opcional)

Si quieres que el bot suene distinto (más formal, con emojis diferentes, otro idioma), los mensajes están todos en `src/bot/conversation.js`, en las llamadas a `provider.sendMessage(...)` y `provider.sendButtons(...)`. No afecta a la lógica de citas — es solo texto.

## ⚠️ Qué NO cambiar salvo que sepas por qué

- El filtro `privateExtendedProperty` en `googleCalendar.js` — es lo que impide que un cliente vea o cancele la cita de otro. Nunca lo quites para "simplificar" el código.
- La comprobación `isSlotStillFree` justo antes de crear/mover una cita — evita que dos clientes reserven el mismo hueco a la vez.
- El manejo de errores en `telegramProvider.js` (los `try/catch` alrededor de `onMessage`) — sin ellos, un fallo de Google Calendar puede tirar todo el proceso.
