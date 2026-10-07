# Live face filter assets

Served locally so camera frames and facial landmarks stay in the browser.

- `vision_wasm_module_internal.js` and `.wasm`: copied from the pinned
  `@mediapipe/tasks-vision@1.0.1` package (Apache-2.0).
- `face_landmarker.task`: Google's Face Landmarker float16 model, version 1:
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
- API guide: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js

If upgrading the npm package, replace both WASM files from that same package version.
