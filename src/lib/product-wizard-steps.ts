import type { Steps } from "../../product-wizard-spec/step-progression.types";
import stepperConfig from "../../product-wizard-spec/product-stepper.config.json";

export interface FlatStep {
  label: string;
  routeOrFunction: string;
  stepIndex: number;
}

/**
 * Flatten stepper config: top-level steps with routeOrFunction become one row;
 * steps with subSteps contribute one row per subStep (using subStep's routeOrFunction).
 */
export function flattenSteps(steps: Steps[]): FlatStep[] {
  const flat: FlatStep[] = [];
  let index = 0;
  for (const step of steps) {
    if (step.subSteps && step.subSteps.length > 0) {
      for (const sub of step.subSteps) {
        if (sub.routeOrFunction) {
          flat.push({ label: sub.label, routeOrFunction: sub.routeOrFunction, stepIndex: index++ });
        }
      }
    } else if (step.routeOrFunction) {
      flat.push({ label: step.label, routeOrFunction: step.routeOrFunction, stepIndex: index++ });
    }
  }
  return flat;
}

export function getStepIndexFromRoute(flatSteps: FlatStep[], routeSegment: string): number {
  const exact = flatSteps.find((s) => s.routeOrFunction === routeSegment);
  if (exact) return exact.stepIndex;
  return 0;
}

export function getRouteFromStepIndex(flatSteps: FlatStep[], stepIndex: number): string {
  const step = flatSteps[stepIndex];
  return step ? step.routeOrFunction : flatSteps[0]?.routeOrFunction ?? "create";
}

const config = stepperConfig as { steps: Steps[] };
export const defaultFlatSteps = flattenSteps(config.steps);
