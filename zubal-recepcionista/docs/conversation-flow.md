# 💬 Flujo de Conversación

Este documento explica cómo fluye una conversación típica con el bot.

## 📌 Menú principal

Cuando un cliente envía `/start` o toca el botón "Menú", ve:

```
👋 ¡Hola! Bienvenido/a a ZubAL Estilistas ✨

¿Qué quieres hacer hoy?

[📅 Reservar cita] [🔎 Ver mis citas] [❌ Cancelar cita] [✏️ Modificar cita]
```

## 📅 Flujo: Reservar cita

```
Cliente: /start

Bot: [Menú principal]

Cliente: [toca "📅 Reservar cita"]

Bot: ✨ Perfecto, ¿qué servicio te gustaría?
     
     [✂️ Corte de Cabello] [🎨 Tinte] [💇‍♀️ Peinado] ...

Cliente: [elige "✂️ Corte de Cabello"]

Bot: 📆 Elige el día que prefieres:
     
     [Monday 4 Nov] [Tuesday 5 Nov] [Wednesday 6 Nov] ...

Cliente: [elige "Tuesday 5 Nov"]

Bot: ⏰ Huecos libres el Tuesday 5 Nov. ¿Cuál te viene bien?
     
     [10:00h] [10:30h] [11:00h] [14:00h] ...

Cliente: [elige "10:30h"]

Bot: ✅ Confirma tu cita:
     
     ✂️ Corte de Cabello
     📅 Tuesday 5 Nov
     ⏰ 10:30h
     
     ¿Correcto?
     
     [✅ Sí, reservar] [↩️ Cancelar]

Cliente: [toca "✅ Sí, reservar"]

Bot: 🎉 ¡Cita reservada!
     
     ✂️ Corte de Cabello
     📅 Tuesday 5 Nov
     ⏰ 10:30h
     
     ¡Te esperamos! 💇‍♀️✨
```

## 🔎 Flujo: Ver mis citas

```
Cliente: /start → [Menú] → [🔎 Ver mis citas]

Bot: 📋 Tus próximas citas:
     
     ✂️ Tuesday 5 Nov a las 10:30
     ✂️ Friday 8 Nov a las 16:00
     
     ¡Que disfrutes! 💇‍♀️
```

Si no tiene citas:

```
Bot: 😅 No tienes ninguna cita reservada.
     
     Escribe /start para reservar una. ¡Te esperamos! 💇‍♀️
```

## ❌ Flujo: Cancelar cita

```
Cliente: /start → [Menú] → [❌ Cancelar cita]

Bot: ⚠️ ¿Cuál de tus citas quieres cancelar?
     
     (No te preocupes, siempre puedes reservar otra)
     
     [5 Nov a las 10:30] [8 Nov a las 16:00]

Cliente: [elige "5 Nov a las 10:30"]

Bot: ✅ Cita cancelada.
     
     ¡Lo sentimos que no puedas venir! 
     Si lo necesitas, escribe /start para reservar otra. 😊
```

## ✏️ Flujo: Modificar cita

```
Cliente: /start → [Menú] → [✏️ Modificar cita]

Bot: ✏️ ¿Cuál de tus citas quieres mover a otro horario?
     
     [5 Nov a las 10:30] [8 Nov a las 16:00]

Cliente: [elige "5 Nov a las 10:30"]

Bot: 📆 Elige el día que prefieres:
     
     [Monday 4 Nov] [Tuesday 5 Nov] [Wednesday 6 Nov] ...

Cliente: [elige "Wednesday 6 Nov"]

Bot: ⏰ Nuevos huecos disponibles el Wednesday 6 Nov. 
     ¿Cuál prefieres?
     
     [10:00h] [10:30h] [11:00h] ...

Cliente: [elige "14:00h"]

Bot: ✅ ¡Cita movida!
     
     📅 Wednesday 6 Nov
     ⏰ 14:00h
     
     ¡Te esperamos! 💇‍♀️✨
```

## 🔒 Reglas de seguridad

- **Un cliente solo ve sus propias citas** - No puede ver ni tocar las de otros
- **No hay citas duplicadas** - El sistema verifica en tiempo real que el hueco está libre
- **Si un hueco se ocupa mientras elige** - Le avisa y le ofrece otra opción

## 🛠️ Personalización

Puedes cambiar los mensajes editando `src/bot/conversation.js`. Busca `await provider.sendMessage(clientId,` o `await provider.sendButtons(clientId,` para ver dónde se definen.

Ejemplos:

```javascript
// Cambiar este mensaje:
await provider.sendMessage(clientId, `👋 ¡Hola! Bienvenido/a a ${config.businessName}`);

// A algo como:
await provider.sendMessage(clientId, `¡Hola! 👋 ¿Cómo te puedo ayudar hoy en ${config.businessName}?`);
```

---

**Nota:** El bot está diseñado para ser simple y robusta. No incluye lenguaje natural (NLP) para evitar errores. Los clientes eligen de botones, no escriben texto libre.

Si en el futuro quieres añadir NLP (entender "el jueves a las 5"), se puede hacer extendiendo `conversation.js` con la API de Claude. Ver `docs/extend-with-claude.md` (próximamente).
