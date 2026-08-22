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
  // 1. Silently copy the HTTPS link to clipboard in the background as an instant fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard && job.appLink) {
    navigator.clipboard.writeText(job.appLink).catch(() => {});
  }

  // 2. Trigger the native Windows Protocol directly (antaglomaprint://...).
  // A hidden iframe can open the app but lose the URI query on some Chrome /
  // Windows combinations, so navigate directly and pass the complete job id
  // and token to the desktop app.
  // Always rebuild the URI from the canonical job id and one-time token. This
  // prevents an older/malformed windows_app_link response from opening the PC
  // app without the complete URL query, which would leave the user needing to
  // click "Ambil & Proses Job" manually.
  const uri = buildWindowsPrintUri(job.jobId, job.token);
  try {
    window.location.assign(uri);
  } catch {
    window.location.href = uri;
  }
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
