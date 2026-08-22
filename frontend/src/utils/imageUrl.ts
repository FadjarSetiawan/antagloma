/**
 * Normalizes image URLs to guarantee they load reliably across all environments (local & cPanel production).
 * Converts direct /storage/ links to the streaming API endpoint /api/storage/.
 */
export const resolveImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // If it's a relative path like 'plant_photos/xxx.jpg' or 'storage/plant_photos/xxx.jpg'
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
    const clean = trimmed.replace(/^\/?api\/?/, '').replace(/^\/?storage\//, '').replace(/^\/+/, '');
    return `/api/storage/${clean}`;
  }

  // If it's a full URL containing /storage/ but NOT /api/storage/
  if (trimmed.includes('/storage/') && !trimmed.includes('/api/storage/')) {
    return trimmed.replace('/storage/', '/api/storage/');
  }

  return trimmed;
};
