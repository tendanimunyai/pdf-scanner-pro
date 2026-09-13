import { describe, expect, it } from 'vitest';

import { initialCaptureFlow, reduceCaptureFlow } from '../src/features/capture/captureFlow';

describe('camera capture flow', () => {
  it('educates before requesting permission and opens the camera after a grant', () => {
    const education = reduceCaptureFlow(initialCaptureFlow, { type: 'start' });
    expect(education.screen).toBe('education');
    expect(
      reduceCaptureFlow(education, { type: 'permission_resolved', granted: true }).screen,
    ).toBe('camera');
  });

  it('provides a recoverable denied state without opening the camera', () => {
    const education = reduceCaptureFlow(initialCaptureFlow, { type: 'start' });
    expect(
      reduceCaptureFlow(education, { type: 'permission_resolved', granted: false }).screen,
    ).toBe('permission_denied');
  });

  it('keeps the app-private source path for review and permits a retake', () => {
    const camera = { screen: 'camera', sourceImagePath: null } as const;
    const review = reduceCaptureFlow(camera, {
      type: 'captured',
      sourceImagePath: 'file:///private/scans/page.jpg',
    });
    expect(review).toEqual({
      screen: 'review',
      sourceImagePath: 'file:///private/scans/page.jpg',
    });
    expect(reduceCaptureFlow(review, { type: 'retake' })).toEqual({
      screen: 'camera',
      sourceImagePath: null,
    });
  });
});
