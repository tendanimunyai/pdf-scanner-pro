export type CaptureScreen = 'home' | 'education' | 'camera' | 'permission_denied' | 'review';

export type CaptureFlowState = Readonly<{
  screen: CaptureScreen;
  sourceImagePath: string | null;
}>;

export type CaptureFlowAction =
  | Readonly<{ type: 'start' }>
  | Readonly<{ type: 'permission_resolved'; granted: boolean }>
  | Readonly<{ type: 'captured'; sourceImagePath: string }>
  | Readonly<{ type: 'retake' }>
  | Readonly<{ type: 'cancel' }>;

export const initialCaptureFlow: CaptureFlowState = { screen: 'home', sourceImagePath: null };

export function reduceCaptureFlow(
  state: CaptureFlowState,
  action: CaptureFlowAction,
): CaptureFlowState {
  switch (action.type) {
    case 'start':
      return state.screen === 'home' ? { screen: 'education', sourceImagePath: null } : state;
    case 'permission_resolved':
      return state.screen === 'education'
        ? { screen: action.granted ? 'camera' : 'permission_denied', sourceImagePath: null }
        : state;
    case 'captured':
      return state.screen === 'camera'
        ? { screen: 'review', sourceImagePath: action.sourceImagePath }
        : state;
    case 'retake':
      return state.screen === 'review' ? { screen: 'camera', sourceImagePath: null } : state;
    case 'cancel':
      return { screen: 'home', sourceImagePath: null };
  }
}
