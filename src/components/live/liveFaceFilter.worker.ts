import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let detector: FaceLandmarker | null = null;
self.onmessage = async (event: MessageEvent) => {
  const { type, baseUrl, frame, timestamp } = event.data;
  try {
    if (type === 'init') {
      const files = await FilesetResolver.forVisionTasks(`${baseUrl}mediapipe`, true);
      detector = await FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${baseUrl}mediapipe/face_landmarker.task`, delegate: 'CPU' },
        runningMode: 'VIDEO', numFaces: 1,
      });
      self.postMessage({ type: 'ready' });
    } else if (type === 'frame' && detector) {
      const result = detector.detectForVideo(frame, timestamp);
      self.postMessage({ type: 'landmarks', points: result.faceLandmarks[0] ?? [], timestamp });
    }
  } catch (error) {
    console.error('Face filter initialization/inference failed:', error);
    self.postMessage({ type: 'error' });
  } finally {
    frame?.close();
  }
};
