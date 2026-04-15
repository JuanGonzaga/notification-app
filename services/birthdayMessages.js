/**
 * Mensagens de aniversário em PT-BR (tom caloroso, variação para não soar robótica).
 */

const WHATSAPP_TEMPLATES = [
  (n) =>
    `Feliz aniversário, ${n}! Que este novo ciclo venha cheio de saúde, risadas e momentos inesquecíveis. Você merece o mundo!`,
  (n) =>
    `Parabéns, ${n}! Hoje é o teu dia — aproveita cada segundo. Desejo que os teus planos floresçam e que a alegria te acompanhe sempre.`,
  (n) =>
    `Muitos parabéns, ${n}! Que a vida te surpreenda com coisas boas, pessoas queridas por perto e muita paz. Feliz aniversário!`,
  (n) =>
    `Feliz aniversário, ${n}! Que seja um ano leve, com conquistas de que te orgulhes e memórias que aqueçam o coração.`,
];

const NOTIFICATION_TITLES = [
  (n) => `Hoje é dia de festa: ${n}`,
  (n) => `Parabéns, ${n}!`,
  (n) => `Aniversário de ${n}`,
  (n) => `Celebra hoje: ${n}`,
];

const NOTIFICATION_BODIES = [
  (n) => `Lembrete doce: não deixes o dia passar em branco. Muitas felicidades, ${n}!`,
  (n) => `Um novo ciclo começa — desejamos um ano incrível para ti, ${n}.`,
  (n) => `Lembrete especial: hoje o protagonista és tu, ${n}. Feliz aniversário!`,
  (n) => `Momento perfeito para parabenizar ${n}. Que o dia seja tão especial quanto tu!`,
];

function hashPick(str, modulo) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

/**
 * Mensagem para WhatsApp / Telegram (escolha estável por nome para não mudar a cada abrir o app).
 * @param {string} name
 * @returns {string}
 */
export function buildBirthdayMessage(name) {
  const n = String(name).trim();
  if (!n) {
    return 'Feliz aniversário! Muitas felicidades neste dia especial.';
  }
  const idx = hashPick(n.toLowerCase(), WHATSAPP_TEMPLATES.length);
  return WHATSAPP_TEMPLATES[idx](n);
}

/**
 * Título e corpo para notificação local (estável por nome).
 * @param {string} name
 * @returns {{ title: string, body: string }}
 */
export function buildScheduledBirthdayNotificationCopy(name) {
  const n = String(name).trim() || 'Amigo';
  const ti = hashPick(`${n}|t`, NOTIFICATION_TITLES.length);
  const bi = hashPick(`${n}|b`, NOTIFICATION_BODIES.length);
  return {
    title: NOTIFICATION_TITLES[ti](n),
    body: NOTIFICATION_BODIES[bi](n),
  };
}
