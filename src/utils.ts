import {
  DataPoint,
  SignalQuality,
  PhaseMode,
  CalibrationState,
  OutcomeCopy,
  AbnormalSimProfile,
  ActivePreview,
  SignalProfile,
} from './types';

/** Rest 30s → Stroop 50s → Breathing 5 min */
export const REST_END = 30;
export const STROOP_END = 80;
export const BREATH_END = 380;
export const FULL_TIMELINE = BREATH_END;

function jitter(t: number, amp = 0.02) {
  return Math.sin(t) * amp;
}

export function generateCalibrationData(
  edaQuality: SignalQuality,
  hrQuality: SignalQuality,
  _isTwoPhase?: boolean
): DataPoint[] {
  const data: DataPoint[] = [];

  for (let t = 0; t <= FULL_TIMELINE; t++) {
    let eda = 2.6;

    if (edaQuality === 'normal') {
      if (t <= REST_END) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + jitter(t);
      } else if (t <= STROOP_END) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 48) / 5));
        eda = 2.6 + (6.8 - 2.6) * sigmoid + jitter(t, 0.03);
      } else {
        const peak = 6.8;
        const sigmoid = 1 / (1 + Math.exp(-(t - 170) / 28));
        eda = peak - (peak - 2.4) * sigmoid + jitter(t);
      }
    } else if (edaQuality === 'plateau') {
      if (t <= REST_END) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + jitter(t);
      } else if (t <= STROOP_END) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 48) / 5));
        eda = 2.6 + (6.8 - 2.6) * sigmoid + jitter(t, 0.03);
      } else {
        eda = 6.8 + 0.06 * Math.sin(t / 14) + jitter(t);
      }
    } else if (edaQuality === 'rising') {
      if (t <= REST_END) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + jitter(t);
      } else if (t <= STROOP_END) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 46) / 5));
        eda = 2.6 + (7.2 - 2.6) * sigmoid + jitter(t, 0.04);
      } else {
        eda = 7.2 + (t - STROOP_END) * 0.006 + 0.08 * Math.sin(t / 12) + jitter(t, 0.03);
      }
    } else if (edaQuality === 'declining') {
      if (t <= REST_END) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + jitter(t);
      } else if (t <= STROOP_END) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 48) / 6));
        eda = 2.6 - (2.6 - 1.9) * sigmoid + jitter(t);
      } else {
        eda = 1.9 + 0.04 * Math.sin(t / 12) + jitter(t, 0.015);
      }
    } else if (edaQuality === 'flat') {
      eda = 2.6 + 0.04 * Math.sin(t / 8) + jitter(t, 0.015);
    } else {
      const base = 2.6 + 0.08 * Math.sin(t / 4);
      const noise = Math.sin(t * 3.5) * 0.4 + Math.sin(t * 12) * 0.15;
      eda = Math.max(0.1, base + noise);
    }

    let hr = 76;

    if (hrQuality === 'normal') {
      if (t <= REST_END) {
        hr = 76 + 0.5 * Math.sin(t / 5) + Math.sin(t * 2.1) * 0.2;
      } else if (t <= STROOP_END) {
        const rise = 2 * Math.min(1, (t - REST_END) / 12);
        hr = 76 + rise + 0.7 * Math.sin(t / 3.5) + Math.sin(t * 2.4) * 0.35;
      } else {
        const elapsed = t - STROOP_END;
        const amplitude = Math.min(5.5, elapsed * 0.12);
        const sineWave = Math.sin((2 * Math.PI * elapsed) / 10);
        const baseHr = 78 - 3 * Math.min(1, elapsed / 40);
        hr = baseHr + amplitude * sineWave + Math.sin(t * 2) * 0.2;
      }
    } else if (hrQuality === 'flat') {
      // Irregular wander — no 10s breathing period
      hr =
        76 +
        2.6 * Math.sin(t * 0.41 + 0.3) +
        1.9 * Math.sin(t * 0.97 + 1.7) +
        1.4 * Math.sin(t * 1.83 + 0.8) +
        1.1 * Math.sin(t * 2.64 + 2.4) +
        0.7 * Math.sin(t * 4.1 + 1.1);
    } else if (t <= REST_END) {
      hr = 76 + 0.5 * Math.sin(t / 5) + Math.sin(t * 2.1) * 0.2;
    } else if (t <= STROOP_END) {
      const rise = 2 * Math.min(1, (t - REST_END) / 12);
      hr = 76 + rise + 0.7 * Math.sin(t / 3.5) + Math.sin(t * 2.4) * 0.35;
    } else {
      const base = 78 + Math.sin(t / 7) * 2;
      const mess = Math.sin(t * 4.6) * 7 + Math.sin(t * 9.4) * 3.8 + Math.sin(t * 2.7) * 2.6;
      const spike = t % 9 < 1.5 ? 10 * Math.sin(((t % 9) / 1.5) * Math.PI) : 0;
      hr = Math.max(52, Math.min(118, base + mess + spike));
    }

    data.push({
      time: t,
      eda: Math.round(eda * 100) / 100,
      hr: Math.round(hr * 10) / 10,
    });
  }

  return data;
}

/** Signals when premise is met: Stroop-induced EDA↑ + HR rhythm during breathing */
const PREMISE_SIGNAL: Record<PhaseMode, Record<'positive' | 'neutral', SignalProfile>> = {
  '3phase': {
    positive: { edaQuality: 'normal', hrQuality: 'normal' },
    neutral: { edaQuality: 'plateau', hrQuality: 'normal' },
  },
  '2phase': {
    positive: { edaQuality: 'normal', hrQuality: 'normal' },
    neutral: { edaQuality: 'plateau', hrQuality: 'normal' },
  },
};

/** User-facing copy: 3 outcomes + negative unified (English) */
export const OUTCOME_COPY: Record<PhaseMode, Record<CalibrationState, OutcomeCopy>> = {
  '3phase': {
    positive: {
      state: 'positive',
      title: 'Your body responded clearly',
      body: 'Skin conductance rose during the task and began to fall after recovery training. Heart rate held a steady rhythm throughout breathing. We captured both stress and recovery.',
      primaryButtonText: 'Enter Home',
    },
    neutral: {
      state: 'neutral',
      title: 'Stress detected, recovery still in progress',
      body: 'Skin conductance rose during the task and heart rate kept a steady rhythm during breathing — but EDA has not clearly fallen yet within this window. That does not mean coherence training failed; EDA recovery often takes longer. Delayed changes may show up on Home later.',
      primaryButtonText: 'Enter Home',
      secondaryButtonText: 'Try Again',
    },
    negative: {
      state: 'negative',
      title: 'Skin conductance is still elevated',
      body: 'Skin conductance rose during stress but continued to climb after recovery training — your body may still be activated. You can enter Home to watch for later changes, or try again when you feel more settled.',
      primaryButtonText: 'Enter Home',
      secondaryButtonText: 'Try Again',
    },
  },
  '2phase': {
    positive: {
      state: 'positive',
      title: 'Alignment complete',
      body: 'Your resting baseline was clear. During breathing training, heart rate held a steady rhythm and skin conductance began to fall. You can start ongoing tracking from Home.',
      primaryButtonText: 'Enter Home',
    },
    neutral: {
      state: 'neutral',
      title: 'Rhythm detected, EDA not yet down',
      body: 'Heart rate held a steady rhythm during breathing, but skin conductance has not clearly fallen yet in this window. That does not mean training failed; EDA recovery often takes longer. Check Home later for delayed response.',
      primaryButtonText: 'Enter Home',
      secondaryButtonText: 'Try Again',
    },
    negative: {
      state: 'negative',
      title: 'Skin conductance is still elevated',
      body: 'Skin conductance did not fall during breathing training and may still be rising. You can enter Home to watch for later changes, or try again when you feel more settled.',
      primaryButtonText: 'Enter Home',
      secondaryButtonText: 'Try Again',
    },
  },
};

/** Curve simulation for negative unified copy (dev / Studio only) */
export const ABNORMAL_SIM_PROFILES: AbnormalSimProfile[] = [
  {
    id: 'interference',
    label: 'Signal interference',
    description: 'Motion / friction noise',
    edaQuality: 'abnormal',
    hrQuality: 'abnormal',
    phases: ['3phase', '2phase'],
  },
  {
    id: 'eda_rising',
    label: 'EDA still rising after training',
    description: 'Recovery trend reversed',
    edaQuality: 'rising',
    hrQuality: 'normal',
    phases: ['3phase', '2phase'],
  },
  {
    id: 'no_stroop',
    label: 'Stress not induced',
    description: 'EDA did not rise during Stroop; HR rhythm normal',
    edaQuality: 'flat',
    hrQuality: 'normal',
    phases: ['3phase'],
  },
  {
    id: 'no_hr_rhythm',
    label: 'No HR rhythm',
    description: 'HR did not show rhythm during breathing',
    edaQuality: 'plateau',
    hrQuality: 'flat',
    phases: ['3phase', '2phase'],
  },
  {
    id: 'both_weak',
    label: 'Both channels weak',
    description: 'Flat signals throughout',
    edaQuality: 'flat',
    hrQuality: 'flat',
    phases: ['3phase', '2phase'],
  },
];

export const PHASE_GROUPS = [
  {
    key: '3phase' as const,
    label: '3-Phase Calibration',
    subtitle: 'Rest → Stroop stress → recovery training',
  },
  {
    key: '2phase' as const,
    label: '2-Phase Quick Calibration',
    subtitle: 'Rest → resonance breathing',
  },
];

export const MAIN_OUTCOMES: { key: CalibrationState; label: string; hint: string }[] = [
  { key: 'positive', label: 'Positive', hint: 'EDA declining + HR rhythm' },
  { key: 'neutral', label: 'Unchanged', hint: 'Premise met, EDA not yet down' },
  { key: 'negative', label: 'Negative', hint: 'Unified copy · highly abnormal' },
];

export function buildActivePreview(
  phase: PhaseMode,
  outcome: CalibrationState,
  abnormalProfileId: string,
  interferenceTarget: 'both' | 'eda' | 'hr' = 'both'
): ActivePreview {
  const copy = OUTCOME_COPY[phase][outcome];
  const isTwoPhase = phase === '2phase';

  if (outcome === 'negative') {
    const profile =
      ABNORMAL_SIM_PROFILES.find((p) => p.id === abnormalProfileId && p.phases.includes(phase)) ||
      ABNORMAL_SIM_PROFILES.find((p) => p.phases.includes(phase))!;

    let signal: SignalProfile = {
      edaQuality: profile.edaQuality,
      hrQuality: profile.hrQuality,
    };

    if (profile.id === 'interference') {
      signal = {
        edaQuality: interferenceTarget === 'both' || interferenceTarget === 'eda' ? 'abnormal' : 'normal',
        hrQuality: interferenceTarget === 'both' || interferenceTarget === 'hr' ? 'abnormal' : 'normal',
      };
    }

    return {
      phase,
      outcome,
      copy,
      signal,
      isTwoPhase,
      abnormalProfileId: profile.id,
    };
  }

  return {
    phase,
    outcome,
    copy,
    signal: PREMISE_SIGNAL[phase][outcome],
    isTwoPhase,
  };
}

export function getAbnormalProfilesForPhase(phase: PhaseMode): AbnormalSimProfile[] {
  return ABNORMAL_SIM_PROFILES.filter((p) => p.phases.includes(phase));
}
