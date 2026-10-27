import type { AiDetectionItem, DetectedGarment } from '../hooks/useProducts';

const LABEL_BY_CLASS: Record<string, string> = {
  short_sleeve_top: 'Áo tay ngắn',
  long_sleeve_top: 'Áo tay dài',
  short_sleeve_outwear: 'Áo khoác tay ngắn',
  long_sleeve_outwear: 'Áo khoác tay dài',
  vest: 'Áo vest',
  sling: 'Áo hai dây',
  shorts: 'Quần short',
  trousers: 'Quần dài',
  skirt: 'Chân váy',
  short_sleeve_dress: 'Váy tay ngắn',
  long_sleeve_dress: 'Váy tay dài',
  vest_dress: 'Váy vest',
  sling_dress: 'Váy hai dây',
};

function normalizeClass(className?: string) {
  return (className || '').trim().toLowerCase().replace(/[-\s]/g, '_');
}

export function garmentTypeOf(className?: string): string {
  const key = normalizeClass(className);
  if (!key) return 'UNKNOWN';
  if (key.includes('trouser') || key.includes('pants') || key.includes('jean') || key.includes('skirt') || key === 'shorts') {
    return 'BOTTOM';
  }
  if (key.includes('outwear') || key.includes('outerwear') || key.includes('jacket') || key.includes('coat') || key === 'vest') {
    return 'OUTERWEAR';
  }
  if (key.endsWith('_top') || key === 'top' || key.includes('shirt') || key.includes('sling') || key.includes('dress')) {
    return 'TOP';
  }
  return 'OTHER_CLOTHING';
}

export function displayLabelOf(className?: string): string {
  const key = normalizeClass(className);
  if (LABEL_BY_CLASS[key]) return LABEL_BY_CLASS[key];
  const type = garmentTypeOf(key);
  if (type === 'TOP') return 'Áo / trang phục trên';
  if (type === 'BOTTOM') return 'Quần / trang phục dưới';
  if (type === 'OUTERWEAR') return 'Áo khoác';
  return (className || 'Trang phục').replace(/[_-]/g, ' ');
}

/** Prefer BE `detectedGarments`; fall back to raw YOLO `detections` so UI never hides multi-items. */
export function resolveDetectedGarments(
  detectedGarments?: DetectedGarment[] | null,
  detections?: AiDetectionItem[] | null,
): DetectedGarment[] {
  if (detectedGarments && detectedGarments.length > 0) {
    return detectedGarments;
  }
  const rows = (detections || [])
    .filter((item) => garmentTypeOf(item.className) !== 'UNKNOWN')
    .map((item) => ({
      className: item.className,
      displayLabel: displayLabelOf(item.className),
      garmentType: garmentTypeOf(item.className),
      confidence: item.confidence,
    }));
  const byType = new Map<string, DetectedGarment>();
  for (const row of rows) {
    const prev = byType.get(row.garmentType);
    if (!prev || row.confidence > prev.confidence) byType.set(row.garmentType, row);
  }
  return Array.from(byType.values()).sort((a, b) => b.confidence - a.confidence);
}
