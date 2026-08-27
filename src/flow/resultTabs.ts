import { CalibrationState, PhaseMode, SignalProfile } from '../types';

/**
 * Result cases (Stroop版):
 *
 * HR rhythm OK:
 *   - EDA↑ + HR rhythm
 *   - EDA flat + HR rhythm
 *   - EDA↓ + HR rhythm
 *
 * Wearing / fit issue:
 *   - EDA & HR both flat, or both noisy
 *
 * No HR rhythm (breathing not followed):
 *   - EDA↑ / flat / ↓ each with its own explanation
 */
export type ResultTabId = 'hr_rhythm' | 'wearing' | 'no_hr_rhythm';

export interface ResultVariant {
  id: string;
  label: string;
  phases: PhaseMode[];
  signal: SignalProfile;
  title: string;
  body: string;
  primaryButtonText: string;
}

export interface ResultTabConfig {
  id: ResultTabId;
  label: string;
  state: CalibrationState;
  variants: ResultVariant[];
}

export function getResultTabs(phase: PhaseMode): ResultTabConfig[] {
  const tabs: ResultTabConfig[] = [
    {
      id: 'hr_rhythm',
      label: 'HR rhythm',
      state: 'positive',
      variants: [
        {
          id: 'hr_ok_eda_rise',
          label: 'EDA↑',
          phases: ['3phase', '2phase'],
          signal: { edaQuality: 'rising', hrQuality: 'normal' },
          title: 'Both signals clear',
          body: 'EDA rose during Stroop — mental effort often does that. Heart rate followed the breathing pace. Keep wearing the ring so it keeps learning.',
          primaryButtonText: 'Enter Home',
        },
        {
          id: 'hr_ok_eda_flat',
          label: 'EDA flat',
          phases: ['3phase', '2phase'],
          signal: { edaQuality: 'flat', hrQuality: 'normal' },
          title: 'HR clear · EDA flat',
          body: 'Heart rate followed the breathing pace. EDA stayed flat during Stroop — that is common; it changes slowly and varies by person. Keep wearing the ring.',
          primaryButtonText: 'Enter Home',
        },
        {
          id: 'hr_ok_eda_down',
          label: 'EDA↓',
          phases: ['3phase'],
          signal: { edaQuality: 'declining', hrQuality: 'normal' },
          title: 'HR clear · EDA dipped',
          body: 'Heart rate followed the breathing pace. EDA dipped slightly during Stroop — bodies respond differently in a short session. Keep wearing the ring.',
          primaryButtonText: 'Enter Home',
        },
      ],
    },
    {
      id: 'wearing',
      label: 'Wearing',
      state: 'negative',
      variants: [
        {
          id: 'wear_flat_both',
          label: 'Both flat',
          phases: ['3phase', '2phase'],
          signal: { edaQuality: 'flat', hrQuality: 'flat' },
          title: 'Flat signals — check fit',
          body: 'No clear EDA or HR pattern. The ring may have been loose, you may have moved too much, or the session was too short. Wear it snugly day to day — readings improve over time.',
          primaryButtonText: 'Enter Home',
        },
        {
          id: 'wear_noisy',
          label: 'Noisy',
          phases: ['3phase', '2phase'],
          signal: { edaQuality: 'abnormal', hrQuality: 'abnormal' },
          title: 'Noisy signals — check fit',
          body: 'EDA and HR were too noisy to read — often from movement, a loose fit, or the environment. This is about wearing, not your body. Keep wearing it snugly.',
          primaryButtonText: 'Enter Home',
        },
      ],
    },
    {
      id: 'no_hr_rhythm',
      label: 'No HR rhythm',
      state: 'neutral',
      variants: [
        {
          id: 'no_hr_eda_rise',
          label: 'EDA↑',
          phases: ['3phase'],
          signal: { edaQuality: 'rising', hrQuality: 'flat' },
          title: 'EDA rose · no HR rhythm',
          body: 'EDA rose during Stroop — we caught that change. Heart rate did not follow the breathing pace, likely because the training was not done correctly. Similar training will appear in the app — next time, please follow the guide. Keep wearing the ring.',
          primaryButtonText: 'Enter Home',
        },
        {
          id: 'no_hr_eda_flat',
          label: 'EDA flat',
          phases: ['3phase'],
          signal: { edaQuality: 'flat', hrQuality: 'flat' },
          title: 'No HR rhythm · EDA flat',
          body: 'Heart rate did not follow the breathing pace — usually the training was not done correctly. EDA stayed flat during Stroop; that varies by person. Similar training will appear in the app — next time, please follow the guide. Keep wearing the ring.',
          primaryButtonText: 'Enter Home',
        },
        {
          id: 'no_hr_eda_down',
          label: 'EDA↓',
          phases: ['3phase'],
          signal: { edaQuality: 'declining', hrQuality: 'flat' },
          title: 'No HR rhythm · EDA dipped',
          body: 'Heart rate did not follow the breathing pace — likely the training was not done correctly. EDA dipped slightly during Stroop; that can be normal in a short session. Similar training will appear in the app — next time, please follow the guide. Keep wearing the ring.',
          primaryButtonText: 'Enter Home',
        },
      ],
    },
  ];

  return tabs.map((tab) => ({
    ...tab,
    variants: tab.variants.filter((v) => v.phases.includes(phase)),
  }));
}

export function getActiveVariant(
  tabs: ResultTabConfig[],
  tabId: ResultTabId,
  variantId: string
): ResultVariant {
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];
  return tab.variants.find((v) => v.id === variantId) ?? tab.variants[0];
}
