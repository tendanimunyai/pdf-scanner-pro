import { describe, expect, it, vi } from 'vitest';

import { Analytics, type AnalyticsProvider } from '../src/services/analytics';

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
});
