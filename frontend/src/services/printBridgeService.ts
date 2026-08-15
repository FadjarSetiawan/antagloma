import { api } from './api';

export type BridgeDocumentType = 'NOTA' | 'SHIPPING_LABEL';

export async function openPrintBridge(packageId: number, documentType: BridgeDocumentType) {
  const response = await api.post('/print-jobs', { package_id: packageId, document_type: documentType });
  const link: string | undefined = response.data?.data?.app_link;
  if (!link) throw new Error('Server tidak mengembalikan App Link print job.');
  window.location.assign(link);
}
