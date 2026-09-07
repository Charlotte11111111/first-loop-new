import React, { useState } from 'react';
import { Activity, RotateCcw, Bell } from 'lucide-react';
import { FlowPath, FlowStepId } from './flow/config';
import { ClickableNodeId, getDemoContextForStep, resolveBackStep } from './flow/graph';
import { FlowChart } from './components/FlowChart';
import { FlowDemoFrame } from './components/FlowDemoFrame';
import { ConnectStep } from './components/flow/ConnectStep';
import { InviteStep } from './components/flow/InviteStep';
import { RestStep } from './components/flow/RestStep';
import { StroopStep } from './components/flow/StroopStep';
import { CoherenceStep } from './components/flow/CoherenceStep';
import { FlowResultsStep, ResultOutcomePanel } from './components/flow/FlowResultsStep';
import { SignalOutcome } from './flow/resultTabs';
import { HomeStep } from './components/flow/HomeStep';

const STEP_TITLES: Record<FlowStepId, string> = {
  register: 'Create account',
  connect: 'Energy OS',
  invite: 'First Loop',
  rest: 'Rest baseline',
  stroop: 'Stroop challenge',
  coherence: 'Breathing training',
  results: 'Results',
  home: 'Home',
};

export default function App() {
  const [activePath, setActivePath] = useState<FlowPath | null>(null);
  const [currentStep, setCurrentStep] = useState<FlowStepId>('connect');
  const [completedSteps, setCompletedSteps] = useState<FlowStepId[]>(['register']);
  const [skippedSteps, setSkippedSteps] = useState<FlowStepId[]>([]);
  const [hadStroop, setHadStroop] = useState(false);
  const [skippedFlow, setSkippedFlow] = useState(false);
  const [abandonedMidFlow, setAbandonedMidFlow] = useState(false);
  const [edaOutcome, setEdaOutcome] = useState<SignalOutcome>('improved');
  const [hrOutcome, setHrOutcome] = useState<SignalOutcome>('improved');
  const [flowKey, setFlowKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const bumpFlow = () => setFlowKey((k) => k + 1);

  const markComplete = (step: FlowStepId) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  };

  const applyContext = (ctx: ReturnType<typeof getDemoContextForStep>) => {
    setCurrentStep(ctx.step);
    setActivePath(ctx.activePath);
    setHadStroop(ctx.hadStroop);
    setSkippedFlow(ctx.skippedFlow);
    setSkippedSteps(ctx.skippedSteps);
    setCompletedSteps(ctx.completedSteps);
    setAbandonedMidFlow(false);
    bumpFlow();
  };

  const handleNodeClick = (nodeId: ClickableNodeId) => {
    const ctx = getDemoContextForStep(nodeId);
    applyContext(ctx);
    showToast(`Go to: ${STEP_TITLES[ctx.step] ?? nodeId}`);
  };

  const handleBack = () => {
    const prev = resolveBackStep(currentStep, hadStroop, skippedFlow);
    if (!prev) return;
    const ctx = getDemoContextForStep(prev);
    applyContext({ ...ctx, step: prev });
    showToast(`Back: ${STEP_TITLES[prev]}`);
  };

  const backStep = resolveBackStep(currentStep, hadStroop, skippedFlow);
  const showBack = backStep !== null;

  const handleConnectContinue = () => {
    markComplete('connect');
    setCurrentStep('invite');
    bumpFlow();
    showToast('First Loop invite');
  };

  const handleConnectSkip = () => {
    applyContext(getDemoContextForStep('invite_skip'));
    showToast('Going to Home');
  };

  const handleInviteAccept = () => {
    setActivePath(null);
    setSkippedFlow(false);
    setSkippedSteps([]);
    setHadStroop(false);
    markComplete('invite');
    setCurrentStep('rest');
    bumpFlow();
    showToast('Starting rest baseline');
  };

  const handleInviteSkip = () => {
    applyContext(getDemoContextForStep('invite_skip'));
    showToast('Going to Home');
  };

  const handleRestComplete = () => {
    markComplete('rest');
    setActivePath('A');
    setHadStroop(true);
    setCurrentStep('stroop');
    bumpFlow();
    showToast('Rest detected · Next: Stroop challenge');
  };

  const handleStroopComplete = () => {
    markComplete('stroop');
    setCurrentStep('coherence');
    bumpFlow();
  };

  const handleCoherenceComplete = () => {
    markComplete('coherence');
    setCurrentStep('results');
    bumpFlow();
  };

  const handleResultsContinue = () => {
    markComplete('results');
    setCurrentStep('home');
    showToast('Going to Home');
  };

  const handleStartFirstLoop = () => {
    setSkippedFlow(false);
    setAbandonedMidFlow(false);
    setActivePath(null);
    setHadStroop(false);
    setCompletedSteps(['register', 'connect']);
    setSkippedSteps([]);
    setCurrentStep('invite');
    bumpFlow();
    showToast('First Loop invite');
  };

  const handleRemeasure = () => {
    setSkippedFlow(false);
    setAbandonedMidFlow(false);
    setActivePath(null);
    setHadStroop(false);
    setCompletedSteps(['register', 'connect', 'invite']);
    setSkippedSteps([]);
    setCurrentStep('rest');
    bumpFlow();
    showToast('Starting rest baseline');
  };

  const handleAbandon = () => {
    const inMeasure = ['rest', 'stroop', 'coherence', 'results'].includes(currentStep);
    applyContext(getDemoContextForStep('invite_skip'));
    setAbandonedMidFlow(inMeasure);
    showToast('Going to Home');
  };

  const handleReset = () => {
    applyContext(getDemoContextForStep('connect'));
    showToast('Flow reset');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'connect':
        return (
          <ConnectStep
            key={`connect-${flowKey}`}
            onContinue={handleConnectContinue}
            onSkip={handleConnectSkip}
          />
        );
      case 'invite':
        return <InviteStep onAccept={handleInviteAccept} onSkip={handleInviteSkip} />;
      case 'rest':
        return <RestStep key={`rest-${flowKey}`} onComplete={handleRestComplete} />;
      case 'stroop':
        return <StroopStep key={`stroop-${flowKey}`} onComplete={handleStroopComplete} />;
      case 'coherence':
        return <CoherenceStep key={`coh-${flowKey}`} onComplete={handleCoherenceComplete} />;
      case 'results':
        return (
          <FlowResultsStep
            key={`res-${flowKey}`}
            hadStroop={hadStroop}
            onContinue={handleResultsContinue}
            edaOutcome={edaOutcome}
            hrOutcome={hrOutcome}
          />
        );
      case 'home':
        return (
          <HomeStep
            skippedFlow={skippedFlow}
            completedFlow={!skippedFlow && completedSteps.includes('results')}
            abandonedMidFlow={abandonedMidFlow}
            onStartFirstLoop={handleStartFirstLoop}
            onRemeasure={handleRemeasure}
          />
        );
      default:
        return (
          <ConnectStep onContinue={handleConnectContinue} onSkip={handleConnectSkip} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800 flex flex-col font-sans">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 text-xs font-semibold text-white flex items-center space-x-2 shadow-xl">
          <Bell className="w-3.5 h-3.5 text-blue-400" />
          <span>{toast}</span>
        </div>
      )}

      <header className="border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight">First Loop Flow Demo</h1>
            <p className="text-[11px] text-slate-400">Click the flowchart · App preview on the right</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        <aside className="lg:col-span-5 xl:col-span-4 border-r border-slate-200 bg-white px-6 py-5 flex flex-col min-h-[calc(100vh-60px)] max-h-[calc(100vh-60px)] overflow-hidden">
          <FlowChart
            activePath={activePath}
            currentStep={currentStep}
            completedSteps={completedSteps}
            skippedSteps={skippedSteps}
            skippedFlow={skippedFlow}
            hadStroop={hadStroop}
            onNodeClick={handleNodeClick}
          />
        </aside>

        <main className="lg:col-span-7 xl:col-span-8 bg-[#eef2f7] flex items-center justify-center gap-6 p-6 overflow-y-auto min-h-[600px]">
          <FlowDemoFrame
            title={STEP_TITLES[currentStep]}
            showBack={showBack}
            onBack={handleBack}
            showQuit={currentStep !== 'home'}
            onQuit={handleAbandon}
          >
            {renderStep()}
          </FlowDemoFrame>
          {currentStep === 'results' && (
            <ResultOutcomePanel
              edaOutcome={edaOutcome}
              hrOutcome={hrOutcome}
              onEdaChange={setEdaOutcome}
              onHrChange={setHrOutcome}
            />
          )}
        </main>
      </div>
    </div>
  );
}
