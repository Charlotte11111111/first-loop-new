import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface InviteStepProps {
  onAccept: () => void;
  onSkip: () => void;
}

export const InviteStep: React.FC<InviteStepProps> = ({ onAccept, onSkip }) => (
  <div className="flex flex-col min-h-[580px] pb-8 bg-[#f6f8fb]">
    <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-5">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight leading-snug">
        Join a First Loop test experience?
      </h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-[290px]">
        About 3 minutes to see how your ring reads your body — and how a short recovery session can
        change how you feel.
      </p>

      <div className="w-full space-y-3 max-w-[300px] text-left">
        <div className="px-3.5 py-3 rounded-xl bg-white border border-slate-100 text-[12px] text-slate-600 leading-relaxed">
          We will guide you through rest baseline, a brief challenge, and breathing recovery — then
          show your before / after signals.
        </div>
      </div>

      <div className="w-full space-y-3 max-w-[300px] mt-8">
        <button
          type="button"
          onClick={onAccept}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Yes, start experience</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-3 rounded-2xl text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors cursor-pointer"
        >
          Not now, go to Home
        </button>
      </div>
    </div>
  </div>
);
