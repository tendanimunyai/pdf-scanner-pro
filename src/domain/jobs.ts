export type JobState = 'queued' | 'running' | 'success' | 'cancelled' | 'failure';
export type JobKind = 'processing' | 'ocr' | 'export' | 'deletion';
export type SafeErrorCode =
  | 'permission_denied'
  | 'camera_unavailable'
  | 'model_unavailable'
  | 'processing_failed'
  | 'storage_full'
  | 'export_cancelled'
  | 'invalid_input';

export type PersistedJob = Readonly<{
  id: string;
  kind: JobKind;
  subjectId: string;
  state: JobState;
  attempt: number;
  createdAt: string;
  updatedAt: string;
  errorCode?: SafeErrorCode;
}>;

const transitions: Record<JobState, readonly JobState[]> = {
  queued: ['running', 'cancelled'],
  running: ['success', 'failure', 'cancelled'],
  failure: ['queued', 'cancelled'],
  success: [],
  cancelled: ['queued'],
};

const safeErrors = new Set<SafeErrorCode>([
  'permission_denied',
  'camera_unavailable',
  'model_unavailable',
  'processing_failed',
  'storage_full',
  'export_cancelled',
  'invalid_input',
]);

export function createJob(id: string, kind: JobKind, subjectId: string, now: string): PersistedJob {
  return { id, kind, subjectId, state: 'queued', attempt: 1, createdAt: now, updatedAt: now };
}

export function transitionJob(
  job: PersistedJob,
  next: JobState,
  now: string,
  errorCode?: string,
): PersistedJob {
  if (!transitions[job.state].includes(next))
    throw new Error(`Invalid job transition: ${job.state} -> ${next}`);
  if (next === 'failure' && (!errorCode || !safeErrors.has(errorCode as SafeErrorCode))) {
    throw new Error('Failures require an allowlisted, redacted error code.');
  }
  const attempt = next === 'queued' ? job.attempt + 1 : job.attempt;
  const base = { ...job, state: next, attempt, updatedAt: now };
  return next === 'failure'
    ? { ...base, errorCode: errorCode as SafeErrorCode }
    : withoutError(base);
}

function withoutError(job: PersistedJob): PersistedJob {
  const { errorCode: _errorCode, ...rest } = job;
  return rest;
}
