# 🤖 Configuración del Bot de Telegram

Aquí te explicamos cómo crear el bot de Telegram y obtener el token.

## Paso 1: Hablar con BotFather

1. Abre Telegram
2. Busca [@BotFather](https://t.me/botfather) (es el bot oficial para crear bots)
3. Haz clic en **"Iniciar"** o envía `/start`

## Paso 2: Crear un nuevo bot

1. Envía el comando `/newbot`
2. BotFather te preguntará:
   - **"¿Qué nombre quieres para tu bot?"** → Escribe: `AgendeX`
   - **"¿Qué nombre de usuario?"** → Escribe algo como: `AgenteIA_Recepcionista_bot` (debe terminar en `_bot`)

3. BotFather te responderá algo como:
   ```
   ✅ Done! Congratulations on your new bot. You'll find it at t.me/AgenteIA_Recepcionista_bot.
   
   Use this token to access the HTTP API:
   123456789:ABCdEf-GhIjKlMnOpQrStUvWxYz
   ```

## Paso 3: Copiar el token

**El token es muy importante.** Es lo que le permite a tu código controlar el bot. Cópialo y guárdalo en lugar seguro.

Para este ejemplo es: `123456789:ABCdEf-GhIjKlMnOpQrStUvWxYz`

## Paso 4: Llenar `.env`

Abre `.env` y rellena:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdEf-GhIjKlMnOpQrStUvWxYz
```

## Paso 5: Prueba el bot

1. Arranca el servidor: `npm start`
2. Busca tu bot en Telegram (a través de [@username](https://t.me/AgenteIA_Recepcionista_bot))
3. Envía `/start`
4. Deberías ver el menú: "¿Qué quieres hacer?"

## ✅ ¡Listo!

El bot ya está vivo. Los clientes pueden encontrarlo en Telegram buscando el username que le diste.

---

**Notas de seguridad:**

- **Nunca compartas el token públicamente** - Con él alguien puede controlar tu bot
- **Guarda el token en `.env`, no en código** - `.env` está en `.gitignore` para evitar que se suba a git
- Si alguien se hace con el token, puedes cambiar la contraseña del bot en BotFather con `/revoke`

---

**Próximos pasos:**

1. Configura Google Calendar (ver `google-calendar-setup.md`)
2. Personaliza los servicios y horarios en `src/config.js`
3. ¡Disfruta! 🎉
