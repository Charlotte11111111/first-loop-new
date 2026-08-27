export type CalibrationState = 'positive' | 'neutral' | 'negative';

export type PhaseMode = '3phase' | '2phase';

export type SignalQuality = 'normal' | 'flat' | 'abnormal' | 'rising' | 'plateau' | 'declining';

export interface OutcomeCopy {
  state: CalibrationState;
  title: string;
  body: string;
  primaryButtonText: string;
  secondaryButtonText?: string;
}

export interface SignalProfile {
  edaQuality: SignalQuality;
  hrQuality: SignalQuality;
}

export interface AbnormalSimProfile extends SignalProfile {
  id: string;
  label: string;
  description: string;
  phases: PhaseMode[];
}

export interface ActivePreview {
  phase: PhaseMode;
  outcome: CalibrationState;
  copy: OutcomeCopy;
  signal: SignalProfile;
  isTwoPhase: boolean;
  /** Negative only: simulated anomaly reason (dev use) */
  abnormalProfileId?: string;
}

export interface DataPoint {
  time: number;
  eda: number;
  hr: number;
}
