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

const FULL_TIMELINE = 120;

export function generateCalibrationData(
  edaQuality: SignalQuality,
  hrQuality: SignalQuality,
  isTwoPhase?: boolean
): DataPoint[] {
  const data: DataPoint[] = [];

  for (let t = 0; t <= FULL_TIMELINE; t++) {
    let eda = 2.6;

    if (edaQuality === 'normal') {
      if (isTwoPhase) {
        // Path B: already elevated after emotional shift → decline during breathing
        if (t <= 30) {
          eda = 4.6 + 0.06 * Math.sin(t / 4) + Math.sin(t) * 0.02;
        } else {
          const sigmoid = 1 / (1 + Math.exp(-(t - 65) / 12));
          eda = 4.6 - (4.6 - 2.2) * sigmoid + Math.sin(t) * 0.02;
        }
      } else if (t <= 30) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + Math.sin(t) * 0.02;
      } else if (t <= 75) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 42) / 4.5));
        eda = 2.6 + (6.8 - 2.6) * sigmoid + Math.sin(t) * 0.03;
      } else {
        const peakEda = 2.6 + (6.8 - 2.6) * (1 / (1 + Math.exp(-(75 - 42) / 4.5)));
        const sigmoid = 1 / (1 + Math.exp(-(t - 88) / 6));
        eda = peakEda - (peakEda - 2.2) * sigmoid + Math.sin(t) * 0.02;
      }
    } else if (edaQuality === 'plateau') {
      // Mild / limited EDA change within Rest → Stroop window
      if (isTwoPhase) {
        if (t <= 30) {
          eda = 4.6 + 0.06 * Math.sin(t / 4) + Math.sin(t) * 0.02;
        } else {
          eda = 4.8 + 0.08 * Math.sin(t / 5) + Math.sin(t * 1.2) * 0.02;
        }
      } else if (t <= 30) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + Math.sin(t) * 0.02;
      } else if (t <= 75) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 48) / 6));
        eda = 2.6 + (4.0 - 2.6) * sigmoid + Math.sin(t) * 0.02;
      } else {
        eda = 4.0 + 0.06 * Math.sin(t / 6) + Math.sin(t * 1.1) * 0.02;
      }
    } else if (edaQuality === 'rising') {
      // Strong EDA climb within Rest → Stroop window
      if (isTwoPhase) {
        if (t <= 30) {
          eda = 4.6 + 0.06 * Math.sin(t / 4) + Math.sin(t) * 0.02;
        } else {
          const sigmoid = 1 / (1 + Math.exp(-(t - 70) / 10));
          eda = 4.6 + (7.2 - 4.6) * sigmoid + Math.sin(t) * 0.03;
        }
      } else if (t <= 30) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + Math.sin(t) * 0.02;
      } else if (t <= 75) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 40) / 4));
        eda = 2.6 + (8.4 - 2.6) * sigmoid + Math.sin(t) * 0.04;
      } else {
        eda = 8.2 + 0.1 * Math.sin(t / 5) + Math.sin(t) * 0.03;
      }
    } else if (edaQuality === 'declining') {
      // EDA dips during Rest → Stroop window
      if (isTwoPhase) {
        if (t <= 30) {
          eda = 4.6 + 0.06 * Math.sin(t / 4) + Math.sin(t) * 0.02;
        } else {
          const sigmoid = 1 / (1 + Math.exp(-(t - 45) / 5));
          eda = 4.6 - (4.6 - 3.4) * sigmoid + Math.sin(t) * 0.02;
        }
      } else if (t <= 30) {
        eda = 2.6 + 0.05 * Math.sin(t / 4) + Math.sin(t) * 0.02;
      } else if (t <= 75) {
        const sigmoid = 1 / (1 + Math.exp(-(t - 42) / 5));
        eda = 2.6 - (2.6 - 1.9) * sigmoid + Math.sin(t) * 0.02;
      } else {
        eda = 1.9 + 0.04 * Math.sin(t / 5) + Math.sin(t) * 0.015;
      }
    } else if (edaQuality === 'flat') {
      const baseEda = isTwoPhase ? 4.6 : 2.6;
      eda = baseEda + 0.04 * Math.sin(t / 5) + Math.sin(t * 1.5) * 0.015;
    } else {
      const base = 2.6 + 0.08 * Math.sin(t / 4);
      let spike = 0;
      const noise = Math.sin(t * 3.5) * 0.4 + Math.sin(t * 12) * 0.15;

      if (t >= 20 && t <= 25) spike = 4.5 * Math.sin((t - 20) * (Math.PI / 2.5));
      else if (t >= 50 && t <= 56) spike = 5.2 * Math.sin((t - 50) * (Math.PI / 3)) * (1 + 0.3 * Math.sin(t * 5));
      else if (t >= 90 && t <= 94) spike = -1.8 + 5.5 * Math.sin((t - 90) * Math.PI / 2);

      eda = Math.max(0.1, base + spike + noise);
    }

    let hr = 76;

    if (hrQuality === 'normal') {
      if (isTwoPhase) {
        // Path B: elevated but steady baseline → rhythmic HR only during breathing
        if (t <= 30) {
          hr = 80 + 0.5 * Math.sin(t / 5) + Math.sin(t * 2.1) * 0.2;
        } else {
          const amplitudeEnvelope = Math.min(6.5, (t - 30) * 0.8);
          const sineWave = Math.sin((2 * Math.PI * (t - 30)) / 10);
          const baseHr = 80 - (80 - 74) * Math.min(1, (t - 30) / 20);
          hr = baseHr + amplitudeEnvelope * sineWave + Math.sin(t * 2) * 0.25;
        }
      } else if (t <= 30) {
        // Rest: stable baseline, tiny natural jitter only
        hr = 76 + 0.5 * Math.sin(t / 5) + Math.sin(t * 2.1) * 0.2;
      } else if (t <= 75) {
        // Stroop: slight HR rise + small irregular jitter — no coherence rhythm
        const rise = 2 * Math.min(1, (t - 30) / 12);
        hr = 76 + rise + 0.7 * Math.sin(t / 3.5) + Math.sin(t * 2.4) * 0.35;
      } else {
        // Coherence: clear ~10s breathing rhythm builds in
        const amplitudeEnvelope = Math.min(6, (t - 75) * 0.9);
        const sineWave = Math.sin((2 * Math.PI * (t - 75)) / 10);
        const baseHr = 78 - (78 - 74) * Math.min(1, (t - 75) / 18);
        hr = baseHr + amplitudeEnvelope * sineWave + Math.sin(t * 2) * 0.2;
      }
    } else if (hrQuality === 'flat') {
      const baseHr = isTwoPhase ? 80 : 76;
      hr = baseHr + 0.5 * Math.sin(t / 3) + Math.sin(t * 2.1) * 0.2;
    } else {
      const base = 76 + Math.sin(t / 8) * 2;
      let artifact = 0;
      const baseNoise = Math.sin(t * 4.5) * 3.5 + Math.sin(t * 8.5) * 1.5;

      if (t >= 40 && t <= 48) artifact = 18 * Math.sin((t - 40) * Math.PI / 4) * (0.8 + 0.4 * Math.cos(t * 6));
      else if (t >= 80 && t <= 86) artifact = -22 + 10 * Math.sin((t - 80) * Math.PI / 3);
      else if (t >= 110 && t <= 116) artifact = 15 * Math.sin((t - 110) * Math.PI / 3);

      hr = Math.max(40, Math.min(130, base + artifact + baseNoise));
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
