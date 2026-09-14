import { describe, expect, it, vi } from 'vitest';

import { Analytics, type AnalyticsProvider } from '../src/services/analytics';
import { LocalDiagnosticsProvider } from '../src/infrastructure/analytics/localDiagnosticsProvider';

describe('privacy-safe analytics', () => {
  it('does not initialize or emit while consent is unresolved or denied', async () => {
    const setCollectionEnabled = vi.fn();
    const logEvent = vi.fn();
    const provider: AnalyticsProvider = { setCollectionEnabled, logEvent };
    const analytics = new Analytics(provider);
    await analytics.track('scan_started', { entry_point: 'library', platform: 'ios' });
    await analytics.setConsent('denied');
    await analytics.track('scan_started', { entry_point: 'library', platform: 'ios' });
    expect(logEvent).not.toHaveBeenCalled();
    expect(setCollectionEnabled).toHaveBeenLastCalledWith(false);
  });

  it('allows catalogued fields after consent and rejects extra fields', async () => {
    const setCollectionEnabled = vi.fn();
    const logEvent = vi.fn();
    const provider: AnalyticsProvider = { setCollectionEnabled, logEvent };
    const analytics = new Analytics(provider);
    await analytics.setConsent('granted');
    await analytics.track('scan_started', { entry_point: 'library', platform: 'android' });
    expect(logEvent).toHaveBeenCalledWith('scan_started', {
      entry_point: 'library',
      platform: 'android',
    });
    await expect(
      analytics.track('scan_started', {
        entry_point: 'library',
        platform: 'android',
        filename: 'secret.pdf',
      } as never),
    ).rejects.toThrow(/not allowed/i);
  });

  it('clears locally retained diagnostics when consent is withdrawn', async () => {
    const clear = vi.fn();
    const analytics = new Analytics({
      setCollectionEnabled: vi.fn(),
      logEvent: vi.fn(),
      clear,
    });
    await analytics.setConsent('denied');
    expect(clear).toHaveBeenCalledOnce();
  });

  it('purges diagnostics using a bounded retention window', async () => {
    const runAsync = vi.fn().mockResolvedValue(undefined);
    const provider = new LocalDiagnosticsProvider({ runAsync } as never);
    await provider.purgeOlderThan(30);
    expect(runAsync).toHaveBeenCalledWith(
      'DELETE FROM diagnostics_events WHERE created_at < ?',
      expect.any(String),
    );
    await expect(provider.purgeOlderThan(0)).rejects.toThrow('invalid_input');
  });
});
