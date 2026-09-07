import React, { useState } from 'react';
import { CalibrationChart } from '../CalibrationChart';
import { generateCalibrationData } from '../../utils';
import {
  SignalOutcome,
  SIGNAL_OUTCOMES,
  EDA_CASES,
  HR_CASES,
  getResultStory,
  StoryTone,
} from '../../flow/resultTabs';

interface FlowResultsStepProps {
  hadStroop: boolean;
  onContinue: () => void;
  edaOutcome: SignalOutcome;
  hrOutcome: SignalOutcome;
}

const HIGHLIGHT: Record<StoryTone, string> = {
  settled: 'bg-emerald-50 border-emerald-100',
  mixed: 'bg-sky-50 border-sky-100',
  unsettled: 'bg-amber-50 border-amber-100',
};

export function ResultOutcomePanel({
  edaOutcome,
  hrOutcome,
  onEdaChange,
  onHrChange,
}: {
  edaOutcome: SignalOutcome;
  hrOutcome: SignalOutcome;
  onEdaChange: (next: SignalOutcome) => void;
  onHrChange: (next: SignalOutcome) => void;
}) {
  return (
    <div className="w-[220px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-400">
        Demo cases
      </p>
      <p className="text-[12px] text-slate-500 leading-relaxed mt-1.5 mb-4">
        Switch each signal. The phone summary and chart captions update together.
      </p>
      <Field label="EDA" value={edaOutcome} onChange={onEdaChange} />
      <div className="h-px bg-slate-100 my-3" />
      <Field label="HR" value={hrOutcome} onChange={onHrChange} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SignalOutcome;
  onChange: (next: SignalOutcome) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-slate-800 mb-2">{label}</p>
      <div className="flex flex-col gap-1.5">
        {SIGNAL_OUTCOMES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium cursor-pointer transition-colors
              ${value === item.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const FlowResultsStep: React.FC<FlowResultsStepProps> = ({
  hadStroop,
  onContinue,
  edaOutcome,
  hrOutcome,
}) => {
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const edaCase = EDA_CASES[edaOutcome];
  const hrCase = HR_CASES[hrOutcome];
  const story = getResultStory(edaOutcome, hrOutcome);
  const chartData = generateCalibrationData(edaCase.quality, hrCase.quality, !hadStroop);

  return (
    <div className="px-5 pt-6 pb-8">
      <div className={`rounded-2xl border px-4 py-4 ${HIGHLIGHT[story.tone]}`}>
        <p className="text-[15px] font-semibold text-slate-900 leading-snug">{story.summary}</p>
        <p className="mt-3 text-[11px] italic text-slate-500/80 leading-relaxed">
          EDA — how activated your body is.
        </p>
        <p className="mt-1 text-[11px] italic text-slate-500/80 leading-relaxed">
          HR — whether your heartbeat follows your breath.
        </p>
      </div>

      <section className="mt-5 rounded-2xl bg-white border border-slate-100 overflow-hidden">
        <div className="px-3 pt-3">
          <CalibrationChart
            type="eda"
            data={chartData}
            quality={edaCase.quality}
            hoveredTime={hoveredTime}
            setHoveredTime={setHoveredTime}
            isTwoPhase={!hadStroop}
          />
        </div>
        <div className="px-4 pb-4 pt-2">
          <p className="text-[13px] text-slate-600 leading-relaxed">{edaCase.caption}</p>
          <p className="mt-2 text-[11px] italic text-slate-400">EDA</p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white border border-slate-100 overflow-hidden">
        <div className="px-3 pt-3">
          <CalibrationChart
            type="hr"
            data={chartData}
            quality={hrCase.quality}
            hoveredTime={hoveredTime}
            setHoveredTime={setHoveredTime}
            isTwoPhase={!hadStroop}
          />
        </div>
        <div className="px-4 pb-4 pt-2">
          <p className="text-[13px] text-slate-600 leading-relaxed">{hrCase.caption}</p>
          <p className="mt-2 text-[11px] italic text-slate-400">HR</p>
        </div>
      </section>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all"
      >
        Enter Home
      </button>
    </div>
  );
};
