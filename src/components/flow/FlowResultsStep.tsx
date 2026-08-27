import React, { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react';
import { CalibrationChart } from '../CalibrationChart';
import { PhaseMode } from '../../types';
import { generateCalibrationData } from '../../utils';
import {
  ResultTabId,
  getResultTabs,
  getActiveVariant,
} from '../../flow/resultTabs';

interface FlowResultsStepProps {
  hadStroop: boolean;
  onContinue: () => void;
}

export const FlowResultsStep: React.FC<FlowResultsStepProps> = ({ hadStroop, onContinue }) => {
  const phaseMode: PhaseMode = hadStroop ? '3phase' : '2phase';
  const tabs = useMemo(() => getResultTabs(phaseMode), [phaseMode]);

  const [activeTabId, setActiveTabId] = useState<ResultTabId>('hr_rhythm');
  const [variantId, setVariantId] = useState('');
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    const tab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
    if (!tab.variants.some((v) => v.id === variantId)) {
      setVariantId(tab.variants[0]?.id ?? '');
    }
  }, [tabs, activeTabId, variantId]);

  const variant = getActiveVariant(tabs, activeTabId, variantId);
  const chartData = generateCalibrationData(
    variant.signal.edaQuality,
    variant.signal.hrQuality,
    phaseMode === '2phase'
  );

  const state = activeTab.state;
  const icon =
    state === 'positive' ? (
      <ShieldCheck className="w-7 h-7 text-emerald-600" />
    ) : state === 'negative' ? (
      <AlertTriangle className="w-7 h-7 text-amber-600" />
    ) : (
      <HelpCircle className="w-7 h-7 text-slate-500" />
    );

  const iconBg =
    state === 'positive'
      ? 'bg-emerald-50 border-emerald-100'
      : state === 'negative'
        ? 'bg-amber-50 border-amber-100'
        : 'bg-slate-50 border-slate-100';

  const handleTabChange = (id: ResultTabId) => {
    setActiveTabId(id);
    const tab = tabs.find((t) => t.id === id);
    setVariantId(tab?.variants[0]?.id ?? '');
  };

  return (
    <div className="pb-6">
      <div className="mx-4 mt-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-[9px] text-slate-500 leading-snug">
          EDA: Rest → Stroop · HR: Rest → Coherence
        </p>
      </div>

      <div className="mx-4 mt-2 flex p-1 bg-slate-100 rounded-xl gap-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-semibold transition-all cursor-pointer tracking-tight
              ${activeTabId === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab.variants.length > 1 && (
        <div className="mx-4 mt-2 flex flex-wrap gap-1.5">
          {activeTab.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariantId(v.id)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-medium border transition-colors cursor-pointer
                ${variant.id === v.id
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pt-2 space-y-2">
        <CalibrationChart
          type="eda"
          data={chartData}
          quality={variant.signal.edaQuality}
          hoveredTime={hoveredTime}
          setHoveredTime={setHoveredTime}
          isTwoPhase={phaseMode === '2phase'}
        />
        <CalibrationChart
          type="hr"
          data={chartData}
          quality={variant.signal.hrQuality}
          hoveredTime={hoveredTime}
          setHoveredTime={setHoveredTime}
          isTwoPhase={phaseMode === '2phase'}
        />
      </div>

      <div className="mx-4 mt-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
        <div className={`w-12 h-12 rounded-full ${iconBg} border flex items-center justify-center mx-auto mb-3`}>
          {icon}
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 mb-2 leading-snug">{variant.title}</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed text-left mb-4">{variant.body}</p>
        <button
          type="button"
          onClick={onContinue}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer active:scale-[0.98] transition-all
            ${state === 'positive' ? 'bg-emerald-600 hover:bg-emerald-700' : state === 'negative' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-slate-900'}`}
        >
          {variant.primaryButtonText}
        </button>
      </div>
    </div>
  );
};
