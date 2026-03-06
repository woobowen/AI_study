import {
  fetchStudyPlan,
  type StudyPlanCallbacks,
  type StudyPlanRequestPayload,
} from './index';

export type { StudyPlanCallbacks, StudyPlanRequestPayload } from './index';

export function generateStudyPlan(
  payload: StudyPlanRequestPayload,
  callbacks?: StudyPlanCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  return fetchStudyPlan(payload, callbacks, signal);
}
