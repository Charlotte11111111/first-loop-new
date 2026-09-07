import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';

interface FlowDemoFrameProps {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  showQuit?: boolean;
  onQuit?: () => void;
}

export const FlowDemoFrame: React.FC<FlowDemoFrameProps> = ({
  title = 'First Loop',
  children,
  showBack = false,
  onBack,
  showQuit = false,
  onQuit,
}) => {
  const [timeStr, setTimeStr] = useState('19:53');
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTimeStr(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setConfirmQuit(false);
  }, [title]);

  return (
    <div className="relative mx-auto select-none" style={{ width: '375px', height: '812px' }}>
      <div className="absolute inset-0 bg-slate-900 rounded-[50px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
        <div className="relative flex-1 bg-[#f6f8fb] rounded-[38px] overflow-hidden flex flex-col text-slate-800">
          <div className="h-11 px-6 pt-3 flex items-center justify-between z-30 bg-[#f6f8fb] text-xs font-semibold shrink-0">
            <span className="font-mono text-[13px]">{timeStr}</span>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-[19px] bg-black rounded-full z-40" />
            <div className="w-5 h-3 border border-slate-900 rounded-[3px] p-px">
              <div className="bg-slate-900 h-full rounded-[1px] w-[80%]" />
            </div>
          </div>

          <div className="h-11 px-4 flex items-center justify-between border-b border-slate-100/60 shrink-0">
            {showBack ? (
              <button onClick={onBack} className="p-1 -ml-1 text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-5" />
            )}
            <span className="text-sm font-semibold text-slate-800">{title}</span>
            {showQuit ? (
              <button
                type="button"
                onClick={() => setConfirmQuit(true)}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Quit
              </button>
            ) : (
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>

          {confirmQuit && (
            <div className="absolute inset-0 z-50 flex items-center justify-center px-6 bg-slate-900/40">
              <div className="w-full rounded-2xl bg-white p-5 shadow-xl">
                <p className="text-[14px] font-semibold text-slate-900 leading-snug">
                  You’ve already started the First Loop test experience. Do you want to quit?
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmQuit(false)}
                    className="py-2.5 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 cursor-pointer active:scale-[0.98]"
                  >
                    Continue test
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmQuit(false);
                      onQuit?.();
                    }}
                    className="py-2.5 rounded-xl bg-slate-900 text-[12px] font-semibold text-white cursor-pointer active:scale-[0.98]"
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-950 rounded-full opacity-70 z-30" />
        </div>
      </div>
    </div>
  );
};

/** Simulated live biosignal bar */
export const LiveSignalBar: React.FC<{
  eda: number;
  hr: number;
  edaTrend?: 'stable' | 'rising' | 'falling';
}> = ({ eda, hr, edaTrend = 'stable' }) => (
  <div className="mx-4 mt-2 px-3 py-2 bg-white/90 backdrop-blur rounded-xl border border-slate-100 shadow-sm flex items-center justify-between text-[10px]">
    <div className="flex items-center space-x-1">
      <span className="text-slate-400">EDA</span>
      <span className="font-mono font-bold text-blue-600">{eda.toFixed(2)}</span>
      <span className="text-slate-300">μS</span>
      {edaTrend === 'rising' && <span className="text-rose-500 text-[9px]">↑</span>}
      {edaTrend === 'falling' && <span className="text-emerald-500 text-[9px]">↓</span>}
    </div>
    <div className="w-px h-3 bg-slate-200" />
    <div className="flex items-center space-x-1">
      <span className="text-slate-400">HR</span>
      <span className="font-mono font-bold text-emerald-600">{hr.toFixed(0)}</span>
      <span className="text-slate-300">bpm</span>
    </div>
  </div>
);

export const PhaseProgress: React.FC<{
  label: string;
  progress: number;
  total: number;
}> = ({ label, progress, total }) => (
  <div className="mx-4 mt-3 px-3 py-2 bg-white rounded-xl border border-slate-100">
    <div className="flex justify-between text-[10px] mb-1.5">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-mono text-slate-700 font-bold">{progress}s / {total}s</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, (progress / total) * 100)}%` }}
      />
    </div>
  </div>
);
