// A scanned QR code encodes the full battery detail-page URL (see
// GenerateQrPage) — pull just the battery code back out of it. Falls back to
// treating the scanned value as a plain code, for scanner guns/testing where
// the raw code is typed instead of a URL.
export default function extractBatteryCode(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    return decodeURIComponent(segments[segments.length - 1] || '');
  } catch {
    return trimmed;
  }
}
