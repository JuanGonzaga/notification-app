import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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

function formatBirthDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export function PeopleList({ people, onDelete, onSendWhatsApp, onSendTelegram }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Aniversários cadastrados</Text>
      {people.length === 0 ? (
        <Text style={styles.empty}>Nenhuma pessoa cadastrada ainda.</Text>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          scrollEnabled={people.length > 4}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.date}>{formatBirthDate(item.birthDate)}</Text>
              </View>
              <View style={styles.actions}>
                {item.isBirthdayToday && (
                  <>
                    <TouchableOpacity
                      style={styles.whatsBtn}
                      onPress={() => onSendWhatsApp(item)}
                      accessibilityLabel={`Enviar parabéns para ${item.name} no WhatsApp`}
                    >
                      <Text style={styles.actionText}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.telegramBtn}
                      onPress={() => onSendTelegram(item)}
                      accessibilityLabel={`Enviar parabéns para ${item.name} no Telegram`}
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  empty: {
    color: '#6c757d',
    fontSize: 15,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  date: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  whatsBtn: {
    backgroundColor: '#25d366',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  telegramBtn: {
    backgroundColor: '#229ed9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
