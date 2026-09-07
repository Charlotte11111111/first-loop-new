import { SignalQuality } from '../types';

export type SignalOutcome = 'improved' | 'unchanged' | 'worse';

export interface SignalCase {
  id: SignalOutcome;
  label: string;
  quality: SignalQuality;
  caption: string;
}

export const SIGNAL_OUTCOMES: { id: SignalOutcome; label: string }[] = [
  { id: 'improved', label: 'Improved' },
  { id: 'unchanged', label: 'No change' },
  { id: 'worse', label: 'Worse' },
];

export type StoryTone = 'settled' | 'mixed' | 'unsettled';

export interface ResultStory {
  tone: StoryTone;
  summary: string;
}

export function getResultStory(eda: SignalOutcome, hr: SignalOutcome): ResultStory {
  if (eda === 'improved' && hr === 'improved') {
    return {
      tone: 'settled',
      summary:
        'The color challenge raised your EDA. After breathing training, both signals improved: EDA declined and HR became steadier.',
    };
  }

  if (eda === 'improved' && hr === 'unchanged') {
    return {
      tone: 'mixed',
      summary:
        'The color challenge raised your EDA. Breathing training brought EDA down, but HR did not become steadier — the breathing guide may not have been followed closely.',
    };
  }

  if (eda === 'improved' && hr === 'worse') {
    return {
      tone: 'mixed',
      summary:
        'The color challenge raised your EDA. Breathing training brought EDA down, but HR stayed uneven — the breathing guide may not have been followed closely.',
    };
  }

  if (eda === 'unchanged' && hr === 'improved') {
    return {
      tone: 'mixed',
      summary:
        'The color challenge raised your EDA. Activation was not eased, while HR became steadier. Further wear and training can help this signal recover.',
    };
  }

  if (eda === 'unchanged' && hr === 'unchanged') {
    return {
      tone: 'unsettled',
      summary:
        'The color challenge raised your EDA. Activation was not eased, and HR did not become steadier. Keep wearing the ring — later training will help recover these signals.',
    };
  }

  if (eda === 'unchanged' && hr === 'worse') {
    return {
      tone: 'unsettled',
      summary:
        'The color challenge raised your EDA. Activation was not eased, and HR stayed uneven. Keep wearing the ring; later sessions will guide the breathing more closely.',
    };
  }

  if (eda === 'worse' && hr === 'improved') {
    return {
      tone: 'mixed',
      summary:
        'The color challenge raised your EDA. Activation was not eased and continued to rise, while HR became steadier. Further wear and training can help this signal recover.',
    };
  }

  if (eda === 'worse' && hr === 'unchanged') {
    return {
      tone: 'unsettled',
      summary:
        'The color challenge raised your EDA. Activation was not eased, and HR did not become steadier. Keep wearing the ring — later training will help recover these signals.',
    };
  }

  return {
    tone: 'unsettled',
    summary:
      'The color challenge raised your EDA. Activation was not eased, and HR stayed uneven. Keep wearing the ring; later sessions will guide the breathing more closely.',
  };
}

export const EDA_CASES: Record<SignalOutcome, SignalCase> = {
  improved: {
    id: 'improved',
    label: 'Improved',
    quality: 'normal',
    caption:
      'The color challenge made your body more activated. Breathing training then eased this signal.',
  },
  unchanged: {
    id: 'unchanged',
    label: 'No change',
    quality: 'plateau',
    caption:
      'The color challenge made your body more activated, and this activation was not eased. Keep wearing the ring — more training can help recover this signal.',
  },
  worse: {
    id: 'worse',
    label: 'Worse',
    quality: 'rising',
    caption:
      'The color challenge made your body more activated, and this activation was not eased. Keep wearing the ring — more training can help recover this signal.',
  },
};

export const HR_CASES: Record<SignalOutcome, SignalCase> = {
  improved: {
    id: 'improved',
    label: 'Improved',
    quality: 'normal',
    caption: 'Breathing training helped your heartbeat settle into a steadier rhythm.',
  },
  unchanged: {
    id: 'unchanged',
    label: 'No change',
    quality: 'flat',
    caption:
      'This may be because the breathing guide was not followed fully. Keep wearing the ring and you can try again in the future.',
  },
  worse: {
    id: 'worse',
    label: 'Worse',
    quality: 'abnormal',
    caption:
      'This may be because the breathing guide was not followed fully. Keep wearing the ring and you can try again in the future.',
  },
};
