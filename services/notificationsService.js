import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * No Expo SDK 53+, importar `expo-notifications` no Expo Go (Android) faz o bundle
 * inicializar código de push e gera erro fatal. Só carregamos o módulo em builds
 * próprios ou em iOS no Expo Go.
 * @see https://docs.expo.dev/versions/latest/sdk/notifications/
 */
export function isExpoGoAndroid() {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

export function canLoadNotificationsNativeModule() {
  if (Platform.OS === 'web') return false;
  if (isExpoGoAndroid()) return false;
  return true;
}

/** @type {Promise<typeof import('expo-notifications')> | null} */
let notificationsModulePromise = null;

/**
 * Carrega expo-notifications só quando é seguro (evita crash no Expo Go Android).
 * @returns {Promise<typeof import('expo-notifications') | null>}
 */
async function getNotificationsModule() {
  if (!canLoadNotificationsNativeModule()) {
    return null;
  }
  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications').then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return Notifications;
    });
  }
  return notificationsModulePromise;
}

const ANDROID_CHANNEL_ID = 'birthday-reminders';

/**
 * Cria canal no Android e pede permissão de notificação.
 * @returns {Promise<boolean>}
 */
export async function ensurePermissionsAndChannel() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Lembretes de aniversário',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/** @returns {Promise<'granted' | 'denied' | 'unavailable'>} */
export async function getNotificationPermissionStatus() {
  if (Platform.OS === 'web' || isExpoGoAndroid()) {
    return 'unavailable';
  }
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return 'unavailable';
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  return 'denied';
}

/**
 * Agenda notificação anual no dia/mês do nascimento (hora fixa 9:00).
 * @param {string} displayName
 * @param {Date | string} birthDate
 * @returns {Promise<string>} id da notificação agendada
 */
export async function scheduleYearlyBirthdayNotification(displayName, birthDate) {
  const d = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Data inválida');
  }

  if (Platform.OS === 'web') {
    throw new Error('Notificações locais não são suportadas na web neste fluxo.');
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error(
      'Notificações não estão disponíveis no Expo Go para Android. Gere um development build (npx expo run:android ou EAS) para testar lembretes.'
    );
  }

  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.YEARLY,
    day: d.getDate(),
    month: d.getMonth(),
    hour: 9,
    minute: 0,
    ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎂 Aniversário hoje!',
      body: `Hoje é o aniversário de ${String(displayName).trim()}.`,
      sound: true,
    },
    trigger,
  });

  return notificationId;
}

/** @param {string | null | undefined} notificationId */
export async function cancelNotification(notificationId) {
  if (!notificationId) return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Agenda uma prévia do lembrete real para daqui a poucos segundos (só desenvolvimento).
 * @param {string} displayName
 * @param {number} [seconds=5]
 * @returns {Promise<string>} id da notificação agendada
 */
export async function scheduleTestNotificationInSeconds(displayName, seconds = 5) {
  if (Platform.OS === 'web') {
    throw new Error('Teste só em dispositivo nativo.');
  }
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error(
      'Notificações indisponíveis neste ambiente (ex.: Expo Go no Android). Use um development build.'
    );
  }

  const sec = Math.max(3, Math.floor(seconds));
  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: sec,
    repeats: false,
    ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '🎂 Aniversário hoje!',
      body: `Hoje é o aniversário de ${String(displayName).trim()}.`,
      sound: true,
    },
    trigger,
  });
}

/** Lista agendamentos atuais (útil para depuração). @returns {Promise<number>} */
export async function getScheduledNotificationsCount() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return 0;
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.length;
}
