import { useEffect, useRef } from 'react';
import { drawFilterPreview, type FaceFilter } from '../../features/live/faceFilters';

export function FaceFilterPreview({ filter }: { filter: FaceFilter }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (ctx) drawFilterPreview(ctx, filter);
  }, [filter]);
  return <canvas ref={ref} width={144} height={144} aria-hidden="true" className="mx-auto h-16 w-16 rounded-xl" />;
}
