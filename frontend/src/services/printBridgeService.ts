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

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window);
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export function isWindowsDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Windows|Win32|Win64/i.test(navigator.userAgent);
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

export async function openPrintBridge(
  packageId: number,
  documentType: BridgeDocumentType,
  notes?: string
): Promise<CreatedPrintJob> {
  const job = await createPrintJob(packageId, documentType, notes);

  if (isAndroidDevice()) {
    // Android: Direct navigation to App Link
    window.location.assign(job.androidAppLink);
  } else if (isMobileDevice()) {
    window.location.assign(job.appLink);
  } else {
    // Desktop / PC: Navigate to fallback/handoff page where custom URI & copy-paste options are presented
    window.location.assign(job.appLink);
  }

  return job;
}

