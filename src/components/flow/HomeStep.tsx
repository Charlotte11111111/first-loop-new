import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HomeStepProps {
  skippedFlow: boolean;
  completedFlow: boolean;
  onStartFirstLoop: () => void;
}

export const HomeStep: React.FC<HomeStepProps> = ({
  skippedFlow,
  completedFlow,
  onStartFirstLoop,
}) => (
  <div className="flex flex-col pb-8 min-h-[560px]">
    <div className="px-4 pt-4 pb-3">
      <p className="text-xs text-slate-400">Good evening</p>
      <h2 className="text-xl font-bold text-slate-900">Energy</h2>
    </div>

    {completedFlow && (
      <div className="mx-4 mb-3 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-[10px] text-emerald-700 leading-snug">
          First Loop complete · Baseline and first signals saved. Wear continues the learning.
        </p>
      </div>
    )}

    <div className="mx-4 mb-3 px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-100">
      <p className="text-[11px] text-slate-600 leading-relaxed">
        Your ring is learning how your body works. Every day brings a clearer picture of your energy
        patterns.
      </p>
    </div>

    {skippedFlow && (
      <button
        type="button"
        onClick={onStartFirstLoop}
        className="mx-4 mb-3 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] transition-transform"
      >
        <span className="text-[12px] font-medium">Try a first experience</span>
        <ArrowRight className="w-4 h-4 shrink-0 opacity-80" />
      </button>
    )}

    <div className="mx-4 mb-4 p-4 bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
          Energy Budget
        </p>
      </div>
      <div className="h-28 rounded-xl bg-slate-50 flex items-center justify-center px-6">
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          {completedFlow
            ? 'Your first baseline is saved. Energy patterns will appear as your ring keeps learning.'
            : 'No energy data yet. Complete First Loop to unlock your budget curve.'}
        </p>
      </div>
    </div>

    <div className="mx-4 p-4 bg-white rounded-2xl border border-slate-100">
      <p className="text-xs font-bold text-slate-700 mb-2">Today</p>
      <div className="h-24 bg-slate-50 rounded-xl flex items-center justify-center">
        <p className="text-[10px] text-slate-400 px-4 text-center">
          {completedFlow
            ? 'Your first signals are saved. Patterns will grow with continued wear.'
            : 'Complete First Loop to unlock more insights'}
        </p>
      </div>
    </div>

    <div className="mx-4 mt-6 flex justify-center space-x-8 pt-2 border-t border-slate-100">
      {['Home', 'Trends', 'Coach', 'Profile'].map((tab, i) => (
        <div
          key={tab}
          className={`text-[10px] font-medium ${i === 0 ? 'text-blue-600' : 'text-slate-400'}`}
        >
          {tab}
        </div>
      ))}
    </div>
  </div>
);
