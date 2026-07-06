// Simulación de conversación en el mock de teléfono: varias conversaciones que rotan
const conversations = [
  [
    { type: 'bot', text: '¡Hola! 👋 Soy AgendeX, el asistente virtual. ¿En qué puedo ayudarte?' },
    { type: 'user', text: 'Quiero pedir una cita' },
    { type: 'bot', text: 'Perfecto 📋 Estos son los próximos huecos disponibles:' },
    { type: 'options', items: ['Mañana 10:30', 'Mañana 12:00', 'Jueves 17:00'] },
    { type: 'user', text: 'Mañana 12:00' },
    { type: 'bot', text: '¡Cita confirmada para mañana a las 12:00! ✅ Te esperamos 😊' },
  ],
  [
    { type: 'user', text: 'Hola, necesito cambiar mi cita del jueves' },
    { type: 'bot', text: 'Claro 🙌 Tienes una cita el jueves a las 17:00. ¿Para cuándo la quieres mover?' },
    { type: 'options', items: ['Viernes 10:00', 'Viernes 16:30', 'Sábado 11:00'] },
    { type: 'user', text: 'Viernes 16:30' },
    { type: 'bot', text: 'Listo ✅ Tu cita ha quedado para el viernes a las 16:30.' },
  ],
  [
    { type: 'user', text: '¿Tenéis hueco para hoy?' },
    { type: 'bot', text: 'Déjame comprobarlo... 🔎 Sí, tenemos disponibilidad a las 18:00 y a las 19:30.' },
    { type: 'options', items: ['Hoy 18:00', 'Hoy 19:30'] },
    { type: 'user', text: 'Hoy 18:00' },
    { type: 'bot', text: '¡Reservado! 🎉 Te esperamos hoy a las 18:00.' },
  ],
  [
    { type: 'user', text: 'Quiero cancelar mi cita de mañana' },
    { type: 'bot', text: 'Sin problema 👍 He cancelado tu cita de mañana a las 10:30.' },
    { type: 'bot', text: '¿Quieres que te proponga un nuevo hueco?' },
    { type: 'user', text: 'No, gracias' },
    { type: 'bot', text: 'Perfecto, aquí estaré cuando lo necesites 😊' },
  ],
];

let conversationIndex = 0;

function appendBubble(chatBody, msg) {
  const el = document.createElement('div');
  if (msg.type === 'options') {
    el.className = 'bubble options';
    el.innerHTML = msg.items.map((i) => `<span>${i}</span>`).join('');
  } else {
    el.className = `bubble ${msg.type}`;
    el.textContent = msg.text;
  }
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function renderConversation() {
  const chatBody = document.getElementById('chat-body');
  if (!chatBody) return 0;
  chatBody.innerHTML = '';
  let delay = 500;

  const conversation = conversations[conversationIndex];
  conversationIndex = (conversationIndex + 1) % conversations.length;

  conversation.forEach((msg) => {
    const textLength = msg.type === 'options' ? msg.items.join('').length : msg.text.length;
    const isBot = msg.type === 'bot' || msg.type === 'options';
    const typingDuration = Math.min(1400, Math.max(600, textLength * 25));

    if (isBot) {
      setTimeout(() => {
        const typingEl = document.createElement('div');
        typingEl.className = 'bubble bot typing';
        typingEl.innerHTML = '<span></span><span></span><span></span>';
        chatBody.appendChild(typingEl);
        chatBody.scrollTop = chatBody.scrollHeight;
      }, delay);

      delay += typingDuration;

      setTimeout(() => {
        const typingEl = chatBody.querySelector('.bubble.typing');
        if (typingEl) typingEl.remove();
        appendBubble(chatBody, msg);
      }, delay);

      delay += 500;
    } else {
      setTimeout(() => appendBubble(chatBody, msg), delay);
      delay += Math.min(900, Math.max(500, textLength * 20));
    }
  });

  return delay;
}

function loopConversation() {
  const totalDelay = renderConversation();
  setTimeout(loopConversation, totalDelay + 2500);
}

// Revela secciones con un fundido suave al hacer scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal, .reveal-fade').forEach((el) => revealObserver.observe(el));

document.addEventListener('DOMContentLoaded', loopConversation);

// Navbar: sombra al hacer scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    navbar.style.boxShadow = '0 8px 24px -12px rgba(0,0,0,0.5)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

// Efecto "dock" (estilo macOS) en todos los botones clicables:
// el botón crece al acercar el cursor y vuelve con un rebote elástico al salir.
document.querySelectorAll('.btn, .dock-item').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = Math.max(rect.width, rect.height);
    const proximity = Math.max(0, 1 - distance / maxDistance);
    const scale = 1 + proximity * 0.12;
    const lift = -proximity * 4;
    btn.style.setProperty('--dock-scale', scale.toFixed(3));
    btn.style.setProperty('--dock-lift', `${lift.toFixed(2)}px`);
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.setProperty('--dock-scale', 1);
    btn.style.setProperty('--dock-lift', '0px');
  });
});

// Formulario de contacto: envía el lead por email vía Web3Forms
const form = document.getElementById('contact-form');
const ctaNote = document.getElementById('cta-note');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button');
    const originalText = button.textContent;
    button.textContent = 'Enviando...';
    button.disabled = true;

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();

      if (result.success) {
        button.textContent = '¡Enviado! Te contactaremos pronto ✅';
        ctaNote.textContent = 'Hemos recibido tu solicitud. Revisa tu email en las próximas 48h.';
        form.reset();
      } else {
        throw new Error(result.message || 'Error desconocido');
      }
    } catch (err) {
      button.textContent = 'Error al enviar, inténtalo de nuevo';
      ctaNote.textContent = 'Ha ocurrido un problema. Prueba de nuevo en unos minutos.';
    }

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 4000);
  });
}
