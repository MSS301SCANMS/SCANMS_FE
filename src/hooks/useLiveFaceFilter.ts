import { useEffect, useRef, useState } from 'react';
import FaceFilterWorker from '@/components/live/liveFaceFilter.worker?worker';
import { drawFaceEffect, type FacePoint, type FaceFilter } from '@/components/live/faceFilters';
export { FACE_FILTERS, type FaceFilter } from '@/components/live/faceFilters';

// The captured canvas is shared by the host preview and WebRTC senders.
export function useLiveFaceFilter(source: MediaStream | null, filter: FaceFilter, strength: number) {
  const [output, setOutput] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [faceDetected, setFaceDetected] = useState(false);
  const settings = useRef({ filter, strength });
  settings.current = { filter, strength };
  const workerRef = useRef<Worker | null>(null);
  const ready = useRef(false);
  const busy = useRef(false);
  const loadTimer = useRef(0);
  const landmarks = useRef<{ points: FacePoint[]; time: number }>({ points: [], time: 0 });
  const smoothedPoints = useRef<FacePoint[]>([]);

  useEffect(() => {
    if (!source || filter === 'off') {
      landmarks.current = { points: [], time: 0 };
      smoothedPoints.current = [];
      setFaceDetected(false);
      return;
    }
    if (workerRef.current) return;
    setStatus('loading');
    const worker = new FaceFilterWorker();
    workerRef.current = worker;
    const timeout = window.setTimeout(() => {
      ready.current = false;
      worker.terminate();
      workerRef.current = null;
      setStatus('error');
    }, 30000);
    loadTimer.current = timeout;
    const fail = () => {
      clearTimeout(timeout);
      ready.current = false;
      busy.current = false;
      worker.terminate();
      workerRef.current = null;
      setStatus('error');
    };
    worker.onerror = fail;
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') {
        clearTimeout(timeout);
        ready.current = true;
        setStatus('ready');
      } else if (data.type === 'landmarks') {
        busy.current = false;
        landmarks.current = { points: data.points, time: performance.now() };
        setFaceDetected(data.points.length > 0);
      } else if (data.type === 'error') fail();
    };
    worker.postMessage({ type: 'init', baseUrl: new URL(import.meta.env.BASE_URL, location.href).href });
    // Worker remains warm across preset changes; camera cleanup owns its lifetime.
  }, [source, filter]);

  useEffect(() => {
    setOutput(null);
    if (!source) { setStatus('idle'); return; }
    let disposed = false;
    let timer = 0;
    let generated: MediaStream | null = null;
    let lastDetection = 0;
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = source;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const render = () => {
      if (disposed || !ctx) return;
      const now = performance.now();
      if (video.readyState >= 2) {
        if (!generated) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          generated = canvas.captureStream(30);
          source.getAudioTracks().forEach((track) => generated!.addTrack(track));
          setOutput(generated);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const { filter: current, strength: amount } = settings.current;
        const points = landmarks.current.points;
        if (current !== 'off' && points.length && now - landmarks.current.time < 450) {
          smoothedPoints.current = points.map((point, index) => {
            const previous = smoothedPoints.current[index];
            return previous ? { ...point, x: previous.x + (point.x - previous.x) * 0.65, y: previous.y + (point.y - previous.y) * 0.65 } : point;
          });
          drawFaceEffect(ctx, video, smoothedPoints.current, current, amount / 100, now);
        } else {
          smoothedPoints.current = [];
        }
        if (current !== 'off' && ready.current && !busy.current && now - lastDetection > 100) {
          lastDetection = now;
          busy.current = true;
          void createImageBitmap(video, { resizeWidth: 640, resizeHeight: Math.round(640 * video.videoHeight / video.videoWidth) })
            .then((frame) => {
              if (disposed || !workerRef.current) { frame.close(); busy.current = false; return; }
              workerRef.current.postMessage({ type: 'frame', frame, timestamp: now }, [frame]);
            }).catch(() => { busy.current = false; });
        }
      }
      timer = window.setTimeout(render, 1000 / 30);
    };
    void video.play().then(render).catch(() => { if (!disposed) setStatus('error'); });
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(loadTimer.current);
      video.pause();
      video.srcObject = null;
      generated?.getVideoTracks().forEach((track) => track.stop());
      workerRef.current?.terminate();
      workerRef.current = null;
      ready.current = false;
      busy.current = false;
      landmarks.current = { points: [], time: 0 };
      smoothedPoints.current = [];
    };
  }, [source]);

  return { stream: source ? output ?? source : null, status, faceDetected };
}
