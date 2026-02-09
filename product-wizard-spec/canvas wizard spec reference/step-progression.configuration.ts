export interface StepProgressionConfiguration {
  steps: Steps[];
  labels: SteppedProgressionLabels;
}

export interface Steps {
  label: string;
  subSteps?: Steps[];
  routeOrFunction?: string;
}

export interface StepConfiguration {
  stepCount: number;
  stepName?: string;
  isRoute?: boolean;
  routeOrFunction?: string;
}
export interface SteppedProgressionLabels {
  stateError: string;
  coverageFactorError: string;
}
