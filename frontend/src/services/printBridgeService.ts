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
  if (!data?.app_link) {
    throw new Error('Server tidak mengembalikan App Link print job.');
  }

  const jobId = data.job_id || '';
  const token = data.token || '';
  const appLink = data.app_link;
  const androidAppLink = data.android_app_link || appLink;
  const windowsAppLink =
    data.windows_app_link ||
    `antaglomaprint://print-jobs/${encodeURIComponent(jobId)}?token=${encodeURIComponent(token)}`;

  return {
    jobId,
    token,
    appLink,
    androidAppLink,
    windowsAppLink,
    expiresAt: data.expires_at,
  };
}

export function handoffPrintJob(job: CreatedPrintJob, token: string): void {
  if (isWindowsDesktop()) {
    const targetUri = job.windowsAppLink || buildWindowsPrintUri(job.jobId, token);
    window.location.assign(targetUri);
    return;
  }

  // Android memakai HTTPS App Link; iOS/desktop non-Windows memakai fallback web.
  window.location.assign(job.androidAppLink || job.appLink);
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

