# 🚀 Deployment en la nube (gratis, 24/7)

Esta es la ruta **probada y recomendada**: Render, plan gratuito para siempre, usando el `render.yaml` incluido para un despliegue en un clic.

## ⚠️ Importante: modo webhook

El plan gratuito de Render "duerme" el servidor tras ~15 min sin actividad. Con long polling (el modo por defecto en local) eso rompería el bot, porque nadie lo "despertaría". Por eso `src/index.js` y `telegramProvider.js` ya soportan **modo webhook**: si defines la variable `PUBLIC_URL`, Telegram llama directamente a tu servidor y lo despierta con cada mensaje. En local, sin `PUBLIC_URL`, sigue usando long polling normal.

## Opción recomendada: Render + Blueprint

1. Sube el proyecto a un repositorio de GitHub (puede ser un repo con varios proyectos, usando `rootDir` en el `render.yaml`)
2. Antes de desplegar, edita `render.yaml`:
   - `name`: nombre del servicio (ej. `mi-negocio-bot`)
   - `rootDir`: ruta a la carpeta del proyecto dentro del repo
3. Ve a `render.com/deploy?repo=https://github.com/tu-usuario/tu-repo`
4. Render detecta el `render.yaml` — te pedirá la ruta si no está en la raíz (**Blueprint Path**, ej. `mi-carpeta/render.yaml`)
5. Rellena las variables de entorno que pide (token de Telegram, credenciales de Google, etc.)
6. Para `PUBLIC_URL`, pon la URL que Render asigna a tu servicio (normalmente `https://<name>.onrender.com` — si es distinta, corrígela después en el dashboard de Render)
7. Clic en **"Deploy Blueprint"** y espera 2-3 minutos

## Verificar que funciona

```
https://tu-servicio.onrender.com/health
```
Debería devolver `ok`.

Y comprobar el webhook de Telegram:
```
https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```
El campo `url` debe apuntar a tu servidor de Render, y `pending_update_count` debería ser bajo.

## Alternativas

- **Railway**: similar a Render pero de pago tras el crédito inicial gratuito — más rápido (sin "sleep"), pero no gratis para siempre.
- **VPS propio + PM2**: control total, sin límites de "sleep", pero requiere mantenimiento manual y sí tiene coste.

## 📋 Checklist antes de desplegar

- [ ] `.env` (en local) tiene todas las variables — nunca lo subas a git
- [ ] Token de Telegram válido
- [ ] Google Calendar API habilitada y calendario compartido con la cuenta de servicio
- [ ] Probado localmente con `npm start` (modo long polling, sin `PUBLIC_URL`)
- [ ] `render.yaml` actualizado con el `name` y `rootDir` correctos

## 📞 Troubleshooting

### "Bot no responde en producción"
- Comprueba `/health` primero
- Revisa `getWebhookInfo` — si `last_error_message` aparece, ahí está la pista
- Mira los logs del servicio en el dashboard de Render

### "Funciona en local pero no en Render"
- Asegúrate de que `PUBLIC_URL` está bien puesta (sin barra final)
- Verifica que las variables de entorno se copiaron bien (sobre todo `GOOGLE_PRIVATE_KEY`, que es larga)

### Conflicto 409 al probar local y producción a la vez
- Telegram solo permite un modo activo (webhook o polling) por bot. Si tienes el bot corriendo en Render (webhook) y lo arrancas también en tu PC (polling), chocarán. Para probar en local, para primero el servicio de Render o usa un bot de pruebas distinto (@BotFather → otro token).

---

¡Tu recepcionista virtual, vivo 24/7 y gratis! 🎉
