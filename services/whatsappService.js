import { Linking } from 'react-native';
import { buildBirthdayMessage } from './birthdayMessages';

/**
 * Abre o WhatsApp com mensagem pronta para o usuário escolher o contato.
 * Faz fallback para o link web se o app não responder ao esquema nativo.
 * @param {string} name
 */
export async function openWhatsAppBirthdayMessage(name) {
  const message = buildBirthdayMessage(name);
  const encoded = encodeURIComponent(message);
  const nativeUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://wa.me/?text=${encoded}`;

  try {
    await Linking.openURL(nativeUrl);
    return;
  } catch {
    await Linking.openURL(webUrl);
  }
}
