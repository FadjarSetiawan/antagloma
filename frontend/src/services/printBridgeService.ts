import { api } from './api';

export type BridgeDocumentType = 'NOTA' | 'SHIPPING_LABEL';

export interface CreatedPrintJob {
  jobId: string;
  token: string;
  appLink: string;
  androidAppLink: string;
  windowsAppLink: string;
  expiresAt?: string;
}

export function isAndroidPhone(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isWindowsDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return /Windows NT/i.test(navigator.userAgent) && !/Android|Mobile/i.test(navigator.userAgent);
}

export function buildWindowsPrintUri(jobId: string, token: string): string {
  return `antaglomaprint://print-jobs/${encodeURIComponent(jobId)}?token=${encodeURIComponent(token)}`;
}

export async function createPrintJob(
  packageId: number,
  documentType: BridgeDocumentType,
  notes?: string
): Promise<CreatedPrintJob> {
  const response = await api.post('/print-jobs', {
    package_id: packageId,
    document_type: documentType,
    ...(documentType === 'NOTA' ? { notes: notes ?? '' } : {}),
  });

  const data = response.data?.data;
  if (!data?.job_id || typeof data.job_id !== 'string') {
    throw new Error('Server tidak mengembalikan job_id print job yang valid.');
  }
  if (!data?.token || typeof data.token !== 'string') {
    throw new Error('Server tidak mengembalikan token print job yang valid.');
  }
  if (!data?.app_link || typeof data.app_link !== 'string') {
    throw new Error('Server tidak mengembalikan app_link print job yang valid.');
  }

  const jobId = data.job_id.trim();
  const token = data.token.trim();
  const appLink = data.app_link.trim();
  const androidAppLink = (data.android_app_link && typeof data.android_app_link === 'string')
    ? data.android_app_link.trim()
    : appLink;
  const windowsAppLink = (data.windows_app_link && typeof data.windows_app_link === 'string')
    ? data.windows_app_link.trim()
    : buildWindowsPrintUri(jobId, token);

  return {
    jobId,
    token,
    appLink,
    androidAppLink,
    windowsAppLink,
    expiresAt: data.expires_at,
  };
}

export function handoffPrintJob(job: CreatedPrintJob, _token?: string): void {
  if (isAndroidPhone()) {
    // Android: use verified App Link
    window.location.assign(job.androidAppLink || job.appLink);
    return;
  }

  // Windows Desktop & Other Platforms:
  // Navigate to the HTTPS fallback page (job.appLink).
  // This page safely triggers antaglomaprint:// in the background while
  // ALWAYS providing the UI with auto-copy, 1-click launch button, and clear guidance!
  window.location.assign(job.appLink);
}

export async function openPrintBridge(
  packageId: number,
  documentType: BridgeDocumentType,
  notes?: string
): Promise<CreatedPrintJob> {
  const job = await createPrintJob(packageId, documentType, notes);
  handoffPrintJob(job, job.token);
  return job;
}

