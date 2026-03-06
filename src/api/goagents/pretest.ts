import { fetchPretest, type PretestCallbacks, type PretestRequestPayload } from './index';

export type { PretestCallbacks, PretestRequestPayload } from './index';

export function fetchPretestQuestions(
  payload: PretestRequestPayload,
  callbacks?: PretestCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  return fetchPretest(payload, callbacks, signal);
}
