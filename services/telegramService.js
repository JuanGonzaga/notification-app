import { Linking } from 'react-native';
import { buildBirthdayMessage } from './birthdayMessages';

/**
 * Abre o Telegram com mensagem pronta para o usuário escolher o contato.
 * Faz fallback para o link web se o app não responder ao esquema nativo.
 * @param {string} name
 */
export async function openTelegramBirthdayMessage(name) {
  const message = buildBirthdayMessage(name);
  const encoded = encodeURIComponent(message);
  const nativeUrl = `tg://msg?text=${encoded}`;
  const webUrl = `https://t.me/share/url?text=${encoded}`;

  try {
    await Linking.openURL(nativeUrl);
    return;
  } catch {
    await Linking.openURL(webUrl);
  }
}
