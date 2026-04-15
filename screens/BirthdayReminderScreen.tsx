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
      Alert.alert('Validação', 'Informe o nome.');
      return;
    }
    if (Number.isNaN(birthDate.getTime())) {
      Alert.alert('Validação', 'Data de nascimento inválida.');
      return;
    }

    const birthIso = localDateToStableIso(birthDate);

    const dup = await hasDuplicate(name, birthIso);
    if (dup) {
      Alert.alert(
        'Duplicado',
        'Já existe alguém cadastrado com o mesmo nome e mesma data de nascimento.'
      );
      return;
    }

    const id = generatePersonId();
    let notificationId = '';

    if (Platform.OS !== 'web' && !isExpoGoAndroid()) {
      try {
        notificationId = await scheduleYearlyBirthdayNotification(name, birthDate);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Não foi possível agendar o lembrete.';
        Alert.alert('Notificação', msg);
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
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir. Tente novamente.');
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
      Alert.alert(
        'WhatsApp',
        'Não foi possível abrir o WhatsApp neste dispositivo agora.'
      );
    }
  };

  const handleSendTelegram = async (person: { name: string }) => {
    try {
      await openTelegramBirthdayMessage(person.name);
    } catch {
      Alert.alert(
        'Telegram',
        'Não foi possível abrir o Telegram neste dispositivo agora.'
      );
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {isExpoGoAndroid() && (
        <Text style={styles.warn}>
          No Expo Go para Android, o módulo de notificações não está disponível (SDK 53+). Os
          aniversários são guardados na mesma; para lembretes reais, use um development build
          (por exemplo npx expo run:android).
        </Text>
      )}
      {!notificationsOk && Platform.OS !== 'web' && !isExpoGoAndroid() && (
        <Text style={styles.warn}>
          Permissão de notificações negada ou indisponível. Os lembretes podem não funcionar.
        </Text>
      )}
      {Platform.OS === 'web' && (
        <Text style={styles.warn}>
          Notificações locais não estão disponíveis na web; use Android ou iOS para testar lembretes.
        </Text>
      )}
      {__DEV__ && Platform.OS !== 'web' && !isExpoGoAndroid() && (
        <View style={styles.devBox}>
          <Text style={styles.devTitle}>Teste rápido (só __DEV__)</Text>
          <TouchableOpacity
            style={styles.devBtn}
            onPress={async () => {
              try {
                const previewName = (people[0]?.name || 'Pessoa de teste').trim();
                await scheduleTestNotificationInSeconds(previewName, 5);
                const n = await getScheduledNotificationsCount();
                Alert.alert(
                  'Prévia agendada',
                  `${n} notificação(ões) na fila. Minimiza a app e espera cerca de 5 segundos para ver o lembrete real.`
                );
              } catch (e) {
                Alert.alert(
                  'Falha no teste',
                  e instanceof Error ? e.message : 'Erro desconhecido.'
                );
              }
            }}
          >
            <Text style={styles.devBtnText}>Prévia do lembrete real (5s)</Text>
          </TouchableOpacity>
          <Text style={styles.devHint}>
            Confirma permissões nas definições do telemóvel se não aparecer nada.
          </Text>
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  warn: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  devBox: {
    backgroundColor: '#e7f1ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b6d4fe',
  },
  devTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#084298',
  },
  devBtn: {
    backgroundColor: '#0d6efd',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  devBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  devHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#084298',
  },
});
