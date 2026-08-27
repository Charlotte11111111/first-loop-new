import { FlowStepId } from './config';

/**
 * Path A and Path B keep separate Breathing / Results / Home nodes because their
 * result pages show different phase sections (3-phase vs 2-phase).
 */
export type ClickableNodeId =
  | FlowStepId
  | 'invite_skip'
  | 'home_c'
  | 'coherence_b'
  | 'results_b'
  | 'home_b';

/** Path B duplicates of shared steps → their underlying step id */
const BRANCH_B_BASE: Record<string, FlowStepId> = {
  coherence_b: 'coherence',
  results_b: 'results',
  home_b: 'home',
};

const BRANCH_A_NODES: FlowStepId[] = ['stroop', 'coherence', 'results', 'home'];

export const PREVIOUS_STEP: Partial<Record<FlowStepId, FlowStepId>> = {
  connect: 'register',
  invite: 'connect',
  rest: 'invite',
  stroop: 'rest',
  coherence: 'stroop',
  results: 'coherence',
  home: 'results',
};

export function resolveBackStep(
  current: FlowStepId,
  hadStroop: boolean,
  skippedFlow: boolean
): FlowStepId | null {
  if (current === 'register' || current === 'connect') return null;
  if (current === 'home') return skippedFlow ? null : 'results';
  if (current === 'coherence') return 'stroop';
  return PREVIOUS_STEP[current] ?? null;
}

export function getDemoContextForStep(step: ClickableNodeId): {
  step: FlowStepId;
  activePath: 'A' | 'B' | 'C' | null;
  hadStroop: boolean;
  skippedFlow: boolean;
  skippedSteps: FlowStepId[];
  completedSteps: FlowStepId[];
} {
  const onboarding = ['register', 'connect', 'invite'] as FlowStepId[];

  switch (step) {
    case 'register':
    case 'connect':
      return {
        step: 'connect',
        activePath: null,
        hadStroop: false,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: ['register'],
      };
    case 'invite':
      return {
        step: 'invite',
        activePath: null,
        hadStroop: false,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: ['register', 'connect'],
      };
    case 'invite_skip':
    case 'home_c':
      return {
        step: 'home',
        activePath: 'C',
        hadStroop: false,
        skippedFlow: true,
        skippedSteps: ['rest', 'stroop', 'coherence', 'results'],
        completedSteps: onboarding,
      };
    case 'rest':
      return {
        step: 'rest',
        activePath: null,
        hadStroop: false,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: onboarding,
      };
    // ---- Main path (Rest → Stroop → Breathing → Results) ----
    case 'stroop':
      return {
        step: 'stroop',
        activePath: 'A',
        hadStroop: true,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: [...onboarding, 'rest'],
      };
    case 'coherence':
      return {
        step: 'coherence',
        activePath: 'A',
        hadStroop: true,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: [...onboarding, 'rest', 'stroop'],
      };
    case 'results':
      return {
        step: 'results',
        activePath: 'A',
        hadStroop: true,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: [...onboarding, 'rest', 'stroop', 'coherence'],
      };
    case 'home':
      return {
        step: 'home',
        activePath: 'A',
        hadStroop: true,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: [...onboarding, 'rest', 'stroop', 'coherence', 'results'],
      };

    // ---- Path B (emotional shift → straight to breathing, 2-phase results) ----
    case 'coherence_b':
      return {
        step: 'coherence',
        activePath: 'B',
        hadStroop: false,
        skippedFlow: false,
        skippedSteps: ['stroop'],
        completedSteps: [...onboarding, 'rest'],
      };
    case 'results_b':
      return {
        step: 'results',
        activePath: 'B',
        hadStroop: false,
        skippedFlow: false,
        skippedSteps: ['stroop'],
        completedSteps: [...onboarding, 'rest', 'coherence'],
      };
    case 'home_b':
      return {
        step: 'home',
        activePath: 'B',
        hadStroop: false,
        skippedFlow: false,
        skippedSteps: ['stroop'],
        completedSteps: [...onboarding, 'rest', 'coherence', 'results'],
      };

    default:
      return {
        step: 'connect',
        activePath: null,
        hadStroop: false,
        skippedFlow: false,
        skippedSteps: [],
        completedSteps: ['register'],
      };
  }
}

export function isNodeActive(
  nodeId: ClickableNodeId,
  currentStep: FlowStepId,
  skippedFlow: boolean,
  hadStroop: boolean
): boolean {
  if (nodeId === 'invite_skip' || nodeId === 'home_c') {
    return skippedFlow && currentStep === 'home';
  }
  if (nodeId === 'register') return false;

  const bBase = BRANCH_B_BASE[nodeId];
  if (bBase) {
    return !skippedFlow && !hadStroop && currentStep === bBase;
  }
  if (BRANCH_A_NODES.includes(nodeId as FlowStepId)) {
    return !skippedFlow && hadStroop && currentStep === nodeId;
  }
  return nodeId === currentStep;
}

export function isNodeCompleted(
  nodeId: ClickableNodeId,
  completedSteps: FlowStepId[],
  _skippedSteps: FlowStepId[],
  hadStroop = false
): boolean {
  if (nodeId === 'invite_skip' || nodeId === 'home_c') return false;
  if (nodeId === 'register') return true;

  const bBase = BRANCH_B_BASE[nodeId];
  if (bBase) {
    return !hadStroop && completedSteps.includes(bBase);
  }
  if (BRANCH_A_NODES.includes(nodeId as FlowStepId)) {
    return hadStroop && completedSteps.includes(nodeId as FlowStepId);
  }
  return completedSteps.includes(nodeId as FlowStepId);
}

export function isNodeSkipped(nodeId: ClickableNodeId, skippedSteps: FlowStepId[]): boolean {
  if (nodeId === 'invite_skip' || nodeId === 'home_c') return false;
  if (BRANCH_B_BASE[nodeId]) return false;
  return skippedSteps.includes(nodeId as FlowStepId);
}
