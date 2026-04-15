import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

export type PersonRow = {
  id: string;
  name: string;
  birthDate: string;
  isBirthdayToday?: boolean;
};

type Props = {
  people: PersonRow[];
  onDelete: (id: string) => void;
  onSendWhatsApp: (person: PersonRow) => void;
  onSendTelegram: (person: PersonRow) => void;
};

const t = {
  title: 'Anivers\u00e1rios cadastrados',
  hint:
    'No dia do anivers\u00e1rio aparecem atalhos para mandar a mensagem com o teu tom favorito.',
  a11yWhats: (name: string) =>
    `Enviar parab\u00e9ns para ${name} no WhatsApp`,
  a11yTg: (name: string) => `Enviar parab\u00e9ns para ${name} no Telegram`,
};

function formatBirthDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export function PeopleList({ people, onDelete, onSendWhatsApp, onSendTelegram }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t.title}</Text>
      {people.length > 0 ? (
        <Text style={styles.sectionHint}>{t.hint}</Text>
      ) : null}
      {people.length === 0 ? (
        <Text style={styles.empty}>Nenhuma pessoa cadastrada ainda.</Text>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          scrollEnabled={people.length > 4}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.row, item.isBirthdayToday && styles.rowBirthday]}>
              <View style={styles.rowText}>
                <View style={styles.nameLine}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.isBirthdayToday ? (
                    <View style={styles.todayPill}>
                      <Text style={styles.todayPillText}>Hoje</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.date}>{formatBirthDate(item.birthDate)}</Text>
              </View>
              <View style={styles.actions}>
                {item.isBirthdayToday && (
                  <>
                    <TouchableOpacity
                      style={styles.whatsBtn}
                      onPress={() => onSendWhatsApp(item)}
                      accessibilityLabel={t.a11yWhats(item.name)}
                    >
                      <Text style={styles.actionText}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.telegramBtn}
                      onPress={() => onSendTelegram(item)}
                      accessibilityLabel={t.a11yTg(item.name)}
                    >
                      <Text style={styles.actionText}>Telegram</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onDelete(item.id)}
                  accessibilityLabel={`Excluir ${item.name}`}
                >
                  <Text style={styles.actionText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: theme.text,
  },
  sectionHint: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 14,
    lineHeight: 20,
  },
  empty: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: theme.bgElevated,
    borderRadius: theme.radiusMd,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  rowBirthday: {
    backgroundColor: theme.birthdayRowBg,
    borderColor: theme.birthdayRowBorder,
    borderWidth: 2,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  todayPill: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  todayPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
  },
  date: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  deleteBtn: {
    backgroundColor: theme.danger,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radiusSm,
  },
  whatsBtn: {
    backgroundColor: theme.whatsapp,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radiusSm,
  },
  telegramBtn: {
    backgroundColor: theme.telegram,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radiusSm,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
