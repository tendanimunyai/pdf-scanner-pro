import type { SQLiteDatabase } from 'expo-sqlite';

import type { AnalyticsProvider } from '../../services/analytics';

/** Opt-in, device-only diagnostics. Payloads have already passed Analytics allowlisting. */
export class LocalDiagnosticsProvider implements AnalyticsProvider {
  private enabled = false;

  public constructor(private readonly database: SQLiteDatabase) {}

  setCollectionEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async logEvent(name: string, parameters: Record<string, string>): Promise<void> {
    if (!this.enabled) return;
    await this.database.runAsync(
      'INSERT INTO diagnostics_events (name, parameters_json, created_at) VALUES (?, ?, ?)',
      name,
      JSON.stringify(parameters),
      new Date().toISOString(),
    );
  }

  async clear(): Promise<void> {
    await this.database.runAsync('DELETE FROM diagnostics_events');
  }

  async purgeOlderThan(days: number): Promise<void> {
    if (!Number.isSafeInteger(days) || days < 1 || days > 365) throw new Error('invalid_input');
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    await this.database.runAsync('DELETE FROM diagnostics_events WHERE created_at < ?', cutoff);
  }
}
