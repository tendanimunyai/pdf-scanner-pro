import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME, migrateDatabase } from './schema';

const KEY_NAME = 'database-encryption-key-v1';

async function createRandomKey(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function openApplicationDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    key = await createRandomKey();
    await SecureStore.setItemAsync(KEY_NAME, key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  // PRAGMA cannot bind parameters. This key is generated internally as hex only.
  await database.execAsync(`PRAGMA key = '${key}'`);
  await database.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  await migrateDatabase(database);
  return database;
}
