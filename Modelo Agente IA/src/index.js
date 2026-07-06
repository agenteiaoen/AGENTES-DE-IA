import express from 'express';
import { config } from './config.js';
import { createTelegramProvider } from './providers/telegramProvider.js';
import { handleIncoming } from './bot/conversation.js';

// Servidor Express mínimo para health checks y preparado para migración a WhatsApp
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.send('ok'));

app.listen(config.port, () => {
  console.log(`✅ Servidor escuchando en el puerto ${config.port}`);
});

const provider = createTelegramProvider((incoming, prov) => handleIncoming(incoming, prov));
await provider.launch(app);
