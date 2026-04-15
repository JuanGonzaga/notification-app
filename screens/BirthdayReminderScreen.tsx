import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BirthdayForm } from '../components/BirthdayForm';
import { PeopleList } from '../components/PeopleList';
import {
  cancelNotification,
  getNotificationPermissionStatus,
  getScheduledNotificationsCount,
  isExpoGoAndroid,
  scheduleTestNotificationInSeconds,
  scheduleYearlyBirthdayNotification,
} from '../services/notificationsService';
import {
  generatePersonId,
  hasDuplicate,
  listPeople,
  removePerson,
  savePerson,
} from '../services/storageService';
import { openTelegramBirthdayMessage } from '../services/telegramService';
import { openWhatsAppBirthdayMessage } from '../services/whatsappService';
import { theme } from '../theme';

/** Textos PT-BR via escapes Unicode: ficheiro .tsx fica ASCII e evita mojibake em cadeias de ferramentas. */
const t = {
  validation: 'Valida\u00e7\u00e3o',
  invalidBirth: 'Data de nascimento inv\u00e1lida.',
  dupBody:
    'J\u00e1 existe algu\u00e9m cadastrado com o mesmo nome e mesma data de nascimento.',
  scheduleFail: 'N\u00e3o foi poss\u00edvel agendar o lembrete.',
  notification: 'Notifica\u00e7\u00e3o',
  deleteFail: 'N\u00e3o foi poss\u00edvel excluir. Tente novamente.',
  whatsFail: 'N\u00e3o foi poss\u00edvel abrir o WhatsApp neste dispositivo agora.',
  tgFail: 'N\u00e3o foi poss\u00edvel abrir o Telegram neste dispositivo agora.',
  heroA11y: '\u00cdcone de bolo de anivers\u00e1rio',
  heroTitle: 'Parab\u00e9ns!',
  expoGoWarn:
    'No Expo Go para Android, o m\u00f3dulo de notifica\u00e7\u00f5es n\u00e3o est\u00e1 dispon\u00edvel (SDK 53+). Os anivers\u00e1rios s\u00e3o guardados na mesma; para lembretes reais, use um development build (por exemplo npx expo run:android).',
  permWarn:
    'Permiss\u00e3o de notifica\u00e7\u00f5es negada ou indispon\u00edvel. Os lembretes podem n\u00e3o funcionar.',
  webWarn:
    'Notifica\u00e7\u00f5es locais n\u00e3o est\u00e3o dispon\u00edveis na web; use Android ou iOS para testar lembretes.',
  devTitle: 'Teste r\u00e1pido (s\u00f3 __DEV__)',
  devBtn: 'Pr\u00e9via do lembrete real (5s)',
  previewTitle: 'Pr\u00e9via agendada',
  previewBody: (n: number) =>
    `${n} notifica\u00e7\u00e3o(\u00f5es) na fila. Minimiza a app e espera cerca de 5 segundos para ver o lembrete real.`,
  devHint:
    'Confirma permiss\u00f5es nas defini\u00e7\u00f5es do telem\u00f3vel se n\u00e3o aparecer nada.',
};

function localDateToStableIso(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  return new Date(y, m, day, 12, 0, 0, 0).toISOString();
}

function isBirthdayToday(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
}

export function BirthdayReminderScreen() {
  const [people, setPeople] = useState<
    { id: string; name: string; birthDate: string; notificationId: string }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsOk, setNotificationsOk] = useState(false);

  const load = useCallback(async () => {
    const list = await listPeople();
    setPeople(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getNotificationPermissionStatus().then((status) => {
      setNotificationsOk(status === 'granted');
    });
  }, []);

  const handleSubmit = async (name: string, birthDate: Date) => {
    if (!name.trim()) {
      Alert.alert(t.validation, 'Informe o nome.');
      return;
    }
    if (Number.isNaN(birthDate.getTime())) {
      Alert.alert(t.validation, t.invalidBirth);
      return;
    }

    const birthIso = localDateToStableIso(birthDate);

    const dup = await hasDuplicate(name, birthIso);
    if (dup) {
      Alert.alert('Duplicado', t.dupBody);
      return;
    }

    const id = generatePersonId();
    let notificationId = '';

    if (Platform.OS !== 'web' && !isExpoGoAndroid()) {
      try {
        notificationId = await scheduleYearlyBirthdayNotification(name, birthDate);
      } catch (e) {
        const msg = e instanceof Error ? e.message : t.scheduleFail;
        Alert.alert(t.notification, msg);
        return;
      }
    }

    await savePerson({ id, name: name.trim(), birthDate: birthIso, notificationId });
    await load();
    Alert.alert('Salvo', `${name.trim()} foi adicionado(a) com sucesso.`);
  };

  const handleDelete = (id: string) => {
    const person = people.find((p) => p.id === id);
    Alert.alert(
      'Excluir',
      person ? `Remover ${person.name} da lista?` : 'Remover esta pessoa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (person?.notificationId) {
                await cancelNotification(person.notificationId);
              }
              await removePerson(id);
              await load();
            } catch {
              Alert.alert('Erro', t.deleteFail);
            }
          },
        },
      ]
    );
  };

  const handleSendWhatsApp = async (person: { name: string }) => {
    try {
      await openWhatsAppBirthdayMessage(person.name);
    } catch {
      Alert.alert('WhatsApp', t.whatsFail);
    }
  };

  const handleSendTelegram = async (person: { name: string }) => {
    try {
      await openTelegramBirthdayMessage(person.name);
    } catch {
      Alert.alert('Telegram', t.tgFail);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      <View style={styles.hero}>
        <Text
          style={styles.heroEmoji}
          accessibilityRole="text"
          accessibilityLabel={t.heroA11y}
        >
          {String.fromCodePoint(0x1f382)}
        </Text>
        <Text style={styles.heroKicker}>Os teus lembretes, com carinho</Text>
        <Text style={styles.heroTitle}>{t.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>
          Guarda datas, recebe um aviso no dia certo e envia uma mensagem especial por WhatsApp
          ou Telegram.
        </Text>
      </View>
      {isExpoGoAndroid() && <Text style={styles.warn}>{t.expoGoWarn}</Text>}
      {!notificationsOk && Platform.OS !== 'web' && !isExpoGoAndroid() && (
        <Text style={styles.warn}>{t.permWarn}</Text>
      )}
      {Platform.OS === 'web' && <Text style={styles.warn}>{t.webWarn}</Text>}
      {__DEV__ && Platform.OS !== 'web' && !isExpoGoAndroid() && (
        <View style={styles.devBox}>
          <Text style={styles.devTitle}>{t.devTitle}</Text>
          <TouchableOpacity
            style={styles.devBtn}
            onPress={async () => {
              try {
                const previewName = (people[0]?.name || 'Pessoa de teste').trim();
                await scheduleTestNotificationInSeconds(previewName, 5);
                const n = await getScheduledNotificationsCount();
                Alert.alert(t.previewTitle, t.previewBody(n));
              } catch (e) {
                Alert.alert(
                  'Falha no teste',
                  e instanceof Error ? e.message : 'Erro desconhecido.'
                );
              }
            }}
          >
            <Text style={styles.devBtnText}>{t.devBtn}</Text>
          </TouchableOpacity>
          <Text style={styles.devHint}>{t.devHint}</Text>
        </View>
      )}
      <BirthdayForm onSubmit={handleSubmit} />
      <PeopleList
        people={people.map((person) => ({
          ...person,
          isBirthdayToday: isBirthdayToday(person.birthDate),
        }))}
        onDelete={handleDelete}
        onSendWhatsApp={handleSendWhatsApp}
        onSendTelegram={handleSendTelegram}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  hero: {
    marginHorizontal: -16,
    marginTop: -4,
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 22,
    backgroundColor: theme.heroTop,
    borderBottomLeftRadius: theme.radiusLg,
    borderBottomRightRadius: theme.radiusLg,
    marginBottom: 20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  heroEmoji: {
    fontSize: 44,
    marginBottom: 6,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    lineHeight: 22,
  },
  warn: {
    backgroundColor: theme.warnBg,
    color: theme.warnText,
    padding: 14,
    borderRadius: theme.radiusMd,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.warnBorder,
  },
  devBox: {
    backgroundColor: theme.devBg,
    borderRadius: theme.radiusMd,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.devBorder,
  },
  devTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: theme.devText,
  },
  devBtn: {
    backgroundColor: theme.accent,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radiusSm,
    alignItems: 'center',
  },
  devBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  devHint: {
    marginTop: 8,
    fontSize: 12,
    color: theme.devText,
    opacity: 0.9,
  },
});
