export type ConsentState = 'unresolved' | 'granted' | 'denied';
type Platform = 'android' | 'ios';

export type AnalyticsEvents = {
  first_open: { app_version: string; platform: Platform; locale: string };
  camera_permission_result: { outcome: 'granted' | 'denied' | 'restricted'; platform: Platform };
  scan_started: { entry_point: 'library' | 'recovery' | 'shortcut'; platform: Platform };
  page_capture_completed: {
    capture_mode: 'manual' | 'auto' | 'import';
    quality_band: 'excellent' | 'usable' | 'retake';
    duration_band: string;
  };
  page_quality_result: { quality_band: 'excellent' | 'usable' | 'retake'; reason_codes: string };
  ocr_completed: {
    outcome: 'success' | 'failure';
    language_code: string;
    duration_band: string;
    confidence_band: string;
  };
  export_started: {
    format: 'pdf' | 'text';
    quality_option: 'low' | 'medium' | 'high';
    page_count_band: string;
  };
  export_completed: {
    outcome: 'success' | 'failure' | 'cancelled';
    duration_band: string;
    failure_code: string;
  };
  first_successful_export: {
    format: 'pdf' | 'text';
    page_count_band: string;
    days_since_install_band: string;
  };
};

const fields: { [K in keyof AnalyticsEvents]: readonly (keyof AnalyticsEvents[K])[] } = {
  first_open: ['app_version', 'platform', 'locale'],
  camera_permission_result: ['outcome', 'platform'],
  scan_started: ['entry_point', 'platform'],
  page_capture_completed: ['capture_mode', 'quality_band', 'duration_band'],
  page_quality_result: ['quality_band', 'reason_codes'],
  ocr_completed: ['outcome', 'language_code', 'duration_band', 'confidence_band'],
  export_started: ['format', 'quality_option', 'page_count_band'],
  export_completed: ['outcome', 'duration_band', 'failure_code'],
  first_successful_export: ['format', 'page_count_band', 'days_since_install_band'],
};

export interface AnalyticsProvider {
  setCollectionEnabled(enabled: boolean): Promise<void> | void;
  logEvent(name: string, parameters: Record<string, string>): Promise<void> | void;
}

export class Analytics {
  private consent: ConsentState = 'unresolved';
  constructor(private readonly provider: AnalyticsProvider) {}

  async setConsent(consent: Exclude<ConsentState, 'unresolved'>): Promise<void> {
    this.consent = consent;
    await this.provider.setCollectionEnabled(consent === 'granted');
  }

  async track<K extends keyof AnalyticsEvents>(
    name: K,
    parameters: AnalyticsEvents[K],
  ): Promise<void> {
    const allowed = new Set<string>(fields[name] as readonly string[]);
    const supplied = Object.keys(parameters);
    if (supplied.some((key) => !allowed.has(key)) || supplied.length !== allowed.size) {
      throw new Error(`Analytics parameters are not allowed for ${name}.`);
    }
    if (this.consent !== 'granted') return;
    await this.provider.logEvent(name, parameters);
  }
}
