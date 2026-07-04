# 🚀 Deployment en la nube

El bot está listo para desplegarse. Aquí hay varias opciones.

## Opción 1: Railway (⭐ Recomendado para principiantes)

### Ventajas:
- Cero configuración
- Gratis los primeros $5/mes
- Deploy automático desde GitHub
- Variables de entorno fáciles

### Pasos:

1. **Crea una cuenta en [railway.app](https://railway.app)**
2. **Conecta tu repositorio GitHub** (o crea uno nuevo)
3. **En tu proyecto de Railway:**
   - Selecciona `Node.js`
   - Deja que detecte automáticamente el `package.json`
4. **Añade variables de entorno:**
   - En "Variables", añade todas las de `.env`:
     ```
     TELEGRAM_BOT_TOKEN=...
     GOOGLE_CLIENT_EMAIL=...
     GOOGLE_PRIVATE_KEY=...
     GOOGLE_CALENDAR_ID=...
     PORT=3000
     ```
5. **Deploy:** 
   - Cada vez que hagas `git push`, Railway redeploy automáticamente

## Opción 2: Render

Parecido a Railway:

1. Crea una cuenta en [render.com](https://render.com)
2. Conecta GitHub
3. Elige "Web Service"
4. Build command: `npm install`
5. Start command: `npm start`
6. Añade las variables de entorno
7. Deploy

## Opción 3: VPS (DigitalOcean, Linode, etc)

Si prefieres más control:

### Requisitos:
- Un VPS con Node.js 18+
- SSH access
- Dominio (opcional)

### Instalación:

```bash
# Conéctate al VPS por SSH
ssh root@tu_ip

# Instala Node.js (si no está)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clona el repositorio
git clone tu_repositorio
cd zubal-recepcionista

# Instala dependencias
npm install

# Crea .env con tus credenciales
nano .env
# (Pega tus valores y guarda)

# Instala PM2 para mantener el proceso vivo
sudo npm install -g pm2

# Arranca el bot
pm2 start src/index.js --name "zubal-recepcionista"
pm2 startup
pm2 save

# (Opcional) Instala Nginx como proxy inverso
sudo apt-get install -y nginx
```

### Configurar Nginx (opcional, para dominio):

```nginx
server {
    listen 80;
    server_name tu_dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

## Opción 4: Docker (avanzado)

Si quieres contenedor:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["npm", "start"]
```

Build y run:
```bash
docker build -t zubal-recepcionista .
docker run -e TELEGRAM_BOT_TOKEN=... -e GOOGLE_CLIENT_EMAIL=... zubal-recepcionista
```

## 📋 Checklist antes de deployar

- [ ] `.env` tiene todas las variables
- [ ] Token de Telegram es válido
- [ ] Google Calendar API está habilitada
- [ ] El email de la cuenta de servicio tiene acceso al calendario
- [ ] Probaste localmente con `npm start`
- [ ] `.gitignore` excluye `.env`
- [ ] No hay secretos en el código

## 🔍 Monitoreo

Después de deployar:

1. **Prueba el bot en Telegram** - Envía `/start` y reserva una cita
2. **Verifica Google Calendar** - Aparece la cita allí?
3. **Revisa logs:**
   - Railway: panel → "Logs"
   - Render: similar
   - VPS: `pm2 logs`

## 📞 Troubleshooting

### "Bot no responde"
- Verifica token de Telegram
- Revisa logs del servidor
- ¿Está el puerto 3000 accesible?

### "No crea citas en Google Calendar"
- Verifica credenciales Google
- ¿Compartiste el calendario con la cuenta de servicio?
- ¿La zona horaria es correcta en `config.js`?

### "¿Cómo updatao el bot?"
- En Railway/Render: `git push` automático
- En VPS:
  ```bash
  cd zubal-recepcionista
  git pull
  npm install
  pm2 restart zubal-recepcionista
  ```

---

¡Felicidades, tu recepcionista virtual está viva! 🎉
