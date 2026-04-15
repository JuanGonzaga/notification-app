import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@birthday_reminder_people';

/**
 * @typedef {{ id: string, name: string, birthDate: string, notificationId: string }} Person
 */

function normalizeName(name) {
  return String(name).trim().toLowerCase();
}

/** @param {string} dateIso */
export function birthDateToComparableKey(dateIso) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** @returns {Promise<Person[]>} */
export async function listPeople() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {string} name @param {string} birthDateIso */
export async function hasDuplicate(name, birthDateIso) {
  const people = await listPeople();
  const n = normalizeName(name);
  const key = birthDateToComparableKey(birthDateIso);
  if (!key) return false;
  return people.some(
    (p) => normalizeName(p.name) === n && birthDateToComparableKey(p.birthDate) === key
  );
}

/** @param {Person} person */
export async function savePerson(person) {
  const people = await listPeople();
  people.push(person);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  return person;
}

/** @param {string} id */
export async function removePerson(id) {
  const people = await listPeople();
  const filtered = people.filter((p) => p.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generatePersonId() {
  return `person_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
