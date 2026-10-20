import { useEffect, useRef, type PointerEvent, type MouseEvent, type KeyboardEvent } from 'react';

export function useLoopingStoreRail(enabled: boolean, contentKey: string) {
  const rail = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const touchUntil = useRef(0);
  const cycle = useRef(0);
  const drag = useRef<{ id:number; x:number; origin:number; moved:boolean } | null>(null);
  const suppressClick = useRef(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrap = (position: number) => {
    const size = cycle.current;
    return enabled && size > 0 ? size + ((position - size) % size + size) % size : position;
  };

  useEffect(() => {
    const element = rail.current;
    if (!element || !enabled) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = preference.matches;
    const onPreference = () => { reducedMotion = preference.matches; };
    preference.addEventListener('change', onPreference);
    const measure = () => {
      const size = (element.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width || 0;
      const oldSize = cycle.current;
      const fraction = oldSize > 0 ? ((element.scrollLeft - oldSize) % oldSize + oldSize) % oldSize / oldSize : 0;
      cycle.current = size;
      element.scrollLeft = size + fraction * size;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    let frame = 0, previous = 0, position = element.scrollLeft, written = position;
    const animate = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 50) : 0;
      previous = now;
      if (!reducedMotion && !document.hidden && !focused.current && !drag.current && now > touchUntil.current && cycle.current > 0) {
        if (Math.abs(element.scrollLeft - written) > 1) position = element.scrollLeft;
        position = wrap(position + elapsed * 0.032);
        element.scrollLeft = position;
        written = element.scrollLeft;
      } else { position = element.scrollLeft; written = position; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clickTimer.current);
      drag.current = null;
      observer.disconnect();
      preference.removeEventListener('change', onPreference);
    };
  }, [enabled, contentKey]);

  const scroll = (direction: number) => {
    const element = rail.current;
    if (element) element.scrollLeft = wrap(element.scrollLeft + direction * element.clientWidth * 0.85);
  };
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') { touchUntil.current = performance.now() + 1000; return; }
    if (drag.current?.id !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    event.currentTarget.removeAttribute('data-dragging');
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { suppressClick.current = false; }, 0);
  };
  return {
    rail, scroll,
    interactionProps: {
      onFocusCapture: (event: React.FocusEvent<HTMLDivElement>) => { focused.current = (event.target as HTMLElement).matches(':focus-visible'); },
      onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) focused.current = false; },
    },
    railProps: {
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'touch') { touchUntil.current = Infinity; return; }
        if (event.button !== 0) return;
        clearTimeout(clickTimer.current);
        suppressClick.current = false;
        drag.current = { id:event.pointerId, x:event.clientX, origin:event.clientX, moved:false };
      },
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        if (!current.moved && Math.abs(event.clientX - current.origin) < 5) return;
        if (!current.moved) {
          current.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.setAttribute('data-dragging', 'true');
        }
        suppressClick.current = true;
        event.preventDefault();
        event.currentTarget.scrollLeft = wrap(event.currentTarget.scrollLeft + current.x - event.clientX);
        current.x = event.clientX;
      },
      onPointerUp: finishDrag,
      onPointerLeave: () => { if (drag.current && !drag.current.moved) drag.current = null; },
      onPointerCancel: finishDrag,
      onLostPointerCapture: finishDrag,
      onDragStart: (event: React.DragEvent<HTMLDivElement>) => event.preventDefault(),
      onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      },
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); scroll(event.key === 'ArrowLeft' ? -1 : 1); }
      },
    },
  };
}
