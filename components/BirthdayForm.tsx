import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  onSubmit: (name: string, birthDate: Date) => Promise<void>;
};

function formatPickerLabel(d: Date) {
  return d.toLocaleDateString('pt-BR');
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function buildDateParts(date: Date) {
  return {
    day: padDatePart(date.getDate()),
    month: padDatePart(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
}

function buildDateFromParts(dayText: string, monthText: string, yearText: string) {
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  if (!day || !month || !yearText || yearText.length < 4) {
    return null;
  }

  const candidate = new Date(year, month - 1, day, 12, 0, 0, 0);
  const isValid =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day &&
    candidate <= new Date();

  return isValid ? candidate : null;
}

export function BirthdayForm({ onSubmit }: Props) {
  const initialDate = new Date(2000, 0, 1);
  const initialParts = buildDateParts(initialDate);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(initialDate);
  const [day, setDay] = useState(initialParts.day);
  const [month, setMonth] = useState(initialParts.month);
  const [year, setYear] = useState(initialParts.year);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const typedDate = buildDateFromParts(day, month, year);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validação', 'Informe o nome.');
      return;
    }
    const parsedDate = buildDateFromParts(day, month, year);
    if (!parsedDate) {
      Alert.alert('Validação', 'Informe uma data válida no formato dia, mês e ano.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed, parsedDate);
      setName('');
      setBirthDate(initialDate);
      setDay(initialParts.day);
      setMonth(initialParts.month);
      setYear(initialParts.year);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Novo aniversário</Text>
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome da pessoa"
        value={name}
        onChangeText={setName}
        editable={!saving}
        autoCapitalize="words"
        autoCorrect={false}
      />
      <Text style={styles.label}>Data de nascimento</Text>
      <View style={styles.dateFieldsRow}>
        <TextInput
          style={[styles.input, styles.dateField]}
          placeholder="DD"
          value={day}
          onChangeText={(text) => setDay(text.replace(/\D/g, '').slice(0, 2))}
          editable={!saving}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.dateField]}
          placeholder="MM"
          value={month}
          onChangeText={(text) => setMonth(text.replace(/\D/g, '').slice(0, 2))}
          editable={!saving}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.yearField]}
          placeholder="AAAA"
          value={year}
          onChangeText={(text) => setYear(text.replace(/\D/g, '').slice(0, 4))}
          editable={!saving}
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
        disabled={saving}
      >
        <Text style={styles.dateButtonText}>
          Escolher no calendario: {formatPickerLabel(typedDate || birthDate)}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={(_, selected) => {
            if (Platform.OS === 'android') {
              setShowPicker(false);
            }
            if (selected) {
              setBirthDate(selected);
              const parts = buildDateParts(selected);
              setDay(parts.day);
              setMonth(parts.month);
              setYear(parts.year);
            }
          }}
          maximumDate={new Date()}
        />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.iosDone}>
          <Text style={styles.iosDoneText}>Fechar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Salvar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dateFieldsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateField: {
    flex: 1,
    textAlign: 'center',
  },
  yearField: {
    flex: 1.4,
    textAlign: 'center',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#212529',
  },
  iosDone: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  iosDoneText: {
    color: '#0d6efd',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
