import type { AnalyticsProvider } from '../../services/analytics';

/** Safe boot provider. A local SQLite diagnostics provider may replace this after opt-in. */
export const disabledAnalyticsProvider: AnalyticsProvider = {
  setCollectionEnabled: () => undefined,
  logEvent: () => undefined,
  clear: () => undefined,
};
