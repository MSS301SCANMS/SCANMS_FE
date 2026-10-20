import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface RegisterMarketController {
  setProducts: (images: readonly string[]) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
}

/** A small shopping story, built locally with articulated meshes and real catalogue images. */
export function createRegisterMarket(host: HTMLElement, onFailure: () => void): RegisterMarketController {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 40);
  camera.position.set(4, 3.1, 8);
  camera.lookAt(0, 0.12, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture; scene.environmentIntensity = 0.45;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#C5AF8C', 1));
  const light = new THREE.DirectionalLight('#FFF7E6', 2);
  light.position.set(-3, 7, 7); light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -5, right: 5, top: 4, bottom: -4, near: 0.5, far: 20 });
  light.shadow.normalBias = 0.025; light.shadow.bias = -0.0003;
  scene.add(light);
  const fill = new THREE.DirectionalLight('#FFFFFF', 0.8); fill.position.set(4, 2, 3); scene.add(fill);
  const white = new THREE.MeshStandardMaterial({ color: '#FFFCF5', roughness: 0.5 });
  const cream = new THREE.MeshStandardMaterial({ color: '#EEDFC6', roughness: 0.65 });
  const gold = new THREE.MeshPhysicalMaterial({ color: '#C59B58', metalness: 0.18, roughness: 0.35, clearcoat: 0.2 });
  const sand = new THREE.MeshStandardMaterial({ color: '#D8C19B', roughness: 0.75 });
  const dark = new THREE.MeshStandardMaterial({ color: '#584330', roughness: 0.72 });
  const skin = new THREE.MeshStandardMaterial({ color: '#EBC09B', roughness: 0.72 });
  const trousers = new THREE.MeshStandardMaterial({ color: '#A58A68', roughness: 0.8 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#EFE8D8', roughness: 0.12, metalness: 0.05, clearcoat: 0.8 });
  const textures = new Set<THREE.Texture>();
  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true;
    parent.add(object); return object;
  }
  function box(parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
    return mesh(parent, new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.14), material, x, y, z);
  }
  function ball(parent: THREE.Object3D, radius: number, material: THREE.Material, x: number, y: number, z: number) {
    return mesh(parent, new THREE.SphereGeometry(radius, 24, 16), material, x, y, z);
  }
  const stage = mesh(scene, new THREE.CylinderGeometry(3.1, 3.14, 0.12, 72), cream, 0, -1.04, 0.15);
  stage.scale.z = 0.59;
  const shop = new THREE.Group(); shop.name = 'register-store'; shop.position.x = -0.45; scene.add(shop);
  box(shop, 2.66, 0.12, 1.5, sand, 0, -0.92, 0);
  box(shop, 2.8, 0.1, 1.65, cream, 0, -0.86, 0.03);
  box(shop, 2.45, 2.1, 0.1, cream, 0, 0.25, -0.63);
  box(shop, 0.12, 2.1, 1.2, white, -1.2, 0.25, 0);
  box(shop, 0.12, 2.1, 1.2, cream, 1.2, 0.25, 0);
  box(shop, 2.6, 0.16, 1.5, white, 0, 1.34, 0);
  // Solid window wall and a genuine door opening, so the character can walk inside.
  box(shop, 1.57, 1.53, 0.13, white, -0.42, -0.05, 0.57);
  box(shop, 0.14, 1.53, 0.13, white, 1.13, -0.05, 0.57);
  box(shop, 2.44, 0.25, 0.13, white, 0, 0.84, 0.57);
  box(shop, 1.24, 1.12, 0.045, gold, -0.48, -0.08, 0.65);
  box(shop, 1.16, 1.04, 0.025, glass, -0.48, -0.08, 0.68);
  box(shop, 0.025, 1.04, 0.035, cream, -0.48, -0.08, 0.705);
  // A few small display objects replace the single-shop name in the window.
  for (const x of [-0.83, -0.18]) {
    box(shop, 0.2, 0.3, 0.07, white, x, -0.29, 0.72);
    box(shop, 0.08, 0.06, 0.08, gold, x, -0.11, 0.72);
  }
  box(shop, 1.1, 0.035, 0.08, cream, -0.48, -0.46, 0.74);
  const sign = box(shop, 2.44, 0.46, 0.13, white, 0, 1.04, 0.64);
  const logoCanvas = document.createElement('canvas'); logoCanvas.width = 1024; logoCanvas.height = 256;
  const ctx = logoCanvas.getContext('2d')!;
  ctx.font = 'bold 150px Georgia, serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillStyle = '#231D15'; ctx.fillText('Scan', 425, 135); ctx.fillStyle = '#B88E4F'; ctx.fillText('MS', 705, 135);
  const logoTexture = new THREE.CanvasTexture(logoCanvas); logoTexture.colorSpace = THREE.SRGBColorSpace; textures.add(logoTexture);
  const logo = mesh(sign, new THREE.PlaneGeometry(2.05, 0.43), new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, depthWrite: false, toneMapped: false }), 0, 0, 0.071);
  logo.castShadow = false;
  const awning = new THREE.Group(); shop.add(awning); awning.position.set(0, 0.73, 0.73);
  for (let i = 0; i < 9; i++) {
    const stripe = box(awning, 0.3, 0.07, 0.6, i % 2 ? white : gold, (i - 4) * 0.3, 0, 0);
    stripe.rotation.x = 0.2;
    box(awning, 0.3, 0.17, 0.07, i % 2 ? white : gold, (i - 4) * 0.3, -0.12, 0.28);
  }
  const door = new THREE.Group(); door.name = 'register-door'; door.position.set(0.37, -0.06, 0.62); shop.add(door);
  box(door, 0.7, 1.5, 0.055, gold, 0.35, 0, 0);
  box(door, 0.62, 1.4, 0.06, glass, 0.35, 0, 0.015);
  box(door, 0.025, 0.19, 0.05, gold, 0.62, -0.05, 0.065);

  const shopper = new THREE.Group(); shopper.name = 'register-shopper'; scene.add(shopper);
  const torso = box(shopper, 0.36, 0.43, 0.25, gold, 0, 0.64, 0);
  const neck = ball(shopper, 0.065, skin, 0, 0.89, 0);
  neck.scale.y = 1.2;
  const head = new THREE.Group(); shopper.add(head); head.position.set(0, 1.08, 0);
  ball(head, 0.205, skin, 0, 0, 0);
  const hair = mesh(head, new THREE.SphereGeometry(0.213, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.53), dark, 0, 0.018, -0.015);
  hair.rotation.z = -0.12;
  ball(head, 0.047, skin, -0.2, -0.015, 0); ball(head, 0.047, skin, 0.2, -0.015, 0);
  const eyes = [-1, 1].map(side => {
    const eye = ball(head, 0.022, dark, side * 0.071, 0.018, 0.184);
    eye.scale.set(0.72, 1, 0.5); return eye;
  });
  ball(head, 0.032, skin, 0, -0.02, 0.205);
  const smile = mesh(head, new THREE.TorusGeometry(0.047, 0.007, 6, 20, Math.PI), dark, 0, -0.055, 0.19);
  smile.rotation.z = Math.PI;
  const legs = [-1, 1].map(side => {
    const pivot = new THREE.Group(); pivot.position.set(side * 0.105, 0.43, 0); shopper.add(pivot);
    box(pivot, 0.14, 0.31, 0.16, trousers, 0, -0.14, 0);
    box(pivot, 0.16, 0.1, 0.26, white, 0, -0.34, 0.035);
    return pivot;
  });
  const arms = [-1, 1].map(side => {
    const pivot = new THREE.Group(); pivot.position.set(side * 0.23, 0.79, 0); shopper.add(pivot);
    box(pivot, 0.13, 0.22, 0.16, gold, 0, -0.08, 0);
    box(pivot, 0.105, 0.19, 0.12, skin, 0, -0.24, 0);
    ball(pivot, 0.065, skin, 0, -0.35, 0);
    return pivot;
  });
  const tote = new THREE.Group(); tote.name = 'register-shopper-tote'; tote.position.set(0.04, -0.56, 0.01); arms[1].add(tote);
  box(tote, 0.31, 0.33, 0.025, white, 0, 0, 0.07);
  box(tote, 0.31, 0.33, 0.025, cream, 0, 0, -0.07);
  box(tote, 0.025, 0.33, 0.14, cream, -0.145, 0, 0);
  box(tote, 0.025, 0.33, 0.14, cream, 0.145, 0, 0);
  box(tote, 0.29, 0.025, 0.14, cream, 0, -0.15, 0);
  box(tote, 0.07, 0.33, 0.008, gold, 0, 0, 0.085);
  const handle = mesh(tote, new THREE.TorusGeometry(0.09, 0.012, 8, 24, Math.PI), gold, 0, 0.16, 0.01);
  handle.scale.y = 1.3;

  const productMaterials: THREE.MeshBasicMaterial[] = [];
  const productFrame = new THREE.MeshBasicMaterial({ color: '#D4B57F', toneMapped: false });
  const products = [0, 1, 2, 3].map(index => {
    const group = new THREE.Group(); group.name = `register-flying-product-${index}`; scene.add(group);
    box(group, 0.72, 0.78, 0.055, productFrame);
    box(group, 0.69, 0.75, 0.02, white, 0, 0, 0.033);
    const material = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }); productMaterials.push(material);
    const photo = mesh(group, new THREE.PlaneGeometry(0.65, 0.65), material, 0, 0.015, 0.047); photo.castShadow = false;
    box(group, 0.15, 0.012, 0.008, productFrame, 0, -0.34, 0.048);
    return group;
  });
  // The visible ring and every product share the same camera-facing orbital path.
  const orbitRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const orbitUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const orbitNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
  const orbitCenter = new THREE.Vector3(0, 0.12, 0).addScaledVector(orbitNormal, 1.8);
  const phases = [2.55, 0.62, 3.9, 5.65];
  const cycleDuration = 14;
  const orbitSpeed = 0.32;
  const flightBegins = 6.3, flightDuration = 1, flightSpacing = 0.58;
  const orbitPosition = (elapsed: number, index: number, target: THREE.Vector3) => {
    const angle = phases[index] + elapsed * orbitSpeed;
    const tilt = (index % 2 ? -1 : 1) * Math.PI / 7.5;
    const x = Math.cos(angle) * 2.68, y = Math.sin(angle) * 1.32;
    return target.copy(orbitCenter).addScaledVector(orbitRight, x * Math.cos(tilt) - y * Math.sin(tilt)).addScaledVector(orbitUp, x * Math.sin(tilt) + y * Math.cos(tilt));
  };
  for (const index of [0, 1]) {
    const points = Array.from({ length: 201 }, (_, i) => orbitPosition((i / 200 * Math.PI * 2 - phases[index]) / orbitSpeed, index, new THREE.Vector3()));
    const material = index
      ? new THREE.LineDashedMaterial({ color: '#C59B58', transparent: true, opacity: 0.3, dashSize: 0.045, gapSize: 0.04 })
      : new THREE.LineBasicMaterial({ color: '#B88E4F', transparent: true, opacity: 0.43 });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    // Orthographic projection preserves the ellipse while the shop occludes it.
    line.position.copy(orbitNormal).multiplyScalar(-4);
    line.computeLineDistances(); scene.add(line);
  }
  const orbitLights = [0, 1].map(() => {
    const light = new THREE.Group(); scene.add(light);
    const halo = mesh(light, new THREE.RingGeometry(0.037, 0.07, 24), new THREE.MeshBasicMaterial({ color: '#C59B58', transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
    halo.quaternion.copy(camera.quaternion); halo.castShadow = false;
    const bead = ball(light, 0.035, new THREE.MeshBasicMaterial({ color: '#D6AD6A', toneMapped: false }), 0, 0, 0);
    bead.castShadow = false;
    return light;
  });
  const flightStart = new THREE.Vector3(), flightNext = new THREE.Vector3(), controlOne = new THREE.Vector3(), controlTwo = new THREE.Vector3();
  const flight = new THREE.CubicBezierCurve3(flightStart, controlOne, controlTwo, new THREE.Vector3());
  const trailGeometry = new THREE.SphereGeometry(0.027, 8, 6);
  const trails = products.map(() => Array.from({ length: 10 }, () => {
    const dot = mesh(scene, trailGeometry, new THREE.MeshBasicMaterial({ color: '#C59B58', transparent: true, opacity: 0, depthWrite: false }));
    dot.castShadow = false; return dot;
  }));
  const arrivalMaterial = new THREE.MeshBasicMaterial({ color: '#C59B58', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const arrivalRing = mesh(scene, new THREE.RingGeometry(0.15, 0.165, 40), arrivalMaterial);
  arrivalRing.castShadow = false; arrivalRing.quaternion.copy(camera.quaternion);
  const bagTarget = new THREE.Vector3();
  const glints = Array.from({ length: 5 }, () => {
    const glint = mesh(scene, new THREE.OctahedronGeometry(0.025), gold);
    glint.castShadow = false; return glint;
  });
  const incoming = new THREE.Vector3(2.35, -1.02, 1.05);
  const doorstep = new THREE.Vector3(0.29, -0.85, 0.97);
  const inside = new THREE.Vector3(0.29, -0.85, -0.28);
  const collect = new THREE.Vector3(0.9, -1.02, 1.29);
  const outgoing = new THREE.Vector3(2.35, -1.02, 1.05);
  const model = new THREE.Group(); model.name = 'register-interactive-model';
  // One coordinate system for the shop, orbital paths, products and delivery effects.
  const sceneObjects = scene.children.filter(object => !(object instanceof THREE.Light));
  scene.add(model); model.add(...sceneObjects);
  const billboardRotation = new THREE.Quaternion();
  // Give the thin platform rim a forgiving pick area, including its underside.
  const stageHitArea = new THREE.Mesh(new THREE.CylinderGeometry(3.23, 3.23, 0.3, 48), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }));
  stageHitArea.position.copy(stage.position); stageHitArea.scale.z = stage.scale.z;
  model.add(stageHitArea);
  const canvas = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragId: number | null = null, dragX = 0, dragY = 0, targetYaw = 0, targetPitch = 0;
  let draggingStage = false, panX = 0, panY = 0;
  const targetPosition = new THREE.Vector3();
  canvas.style.touchAction = 'pan-y';
  function hitsModel(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    scene.updateMatrixWorld(true); raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects([shop, stage, stageHitArea], true)[0];
  }
  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || dragId !== null) return;
    const hit = hitsModel(event); if (!hit) return;
    draggingStage = hit.object === stage || hit.object === stageHitArea;
    dragId = event.pointerId; dragX = event.clientX; dragY = event.clientY;
    canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing';
  }
  function pointerMove(event: PointerEvent) {
    if (dragId !== event.pointerId) { if (dragId === null) canvas.style.cursor = hitsModel(event) ? 'grab' : ''; return; }
    const width = Math.max(canvas.clientWidth, 1);
    if (draggingStage && !event.shiftKey) {
      const unitsPerPixel = (camera.right - camera.left) / width;
      panX = THREE.MathUtils.clamp(panX + (event.clientX - dragX) * unitsPerPixel, -0.55, 0.55);
      panY = THREE.MathUtils.clamp(panY - (event.clientY - dragY) * unitsPerPixel, -0.35, 0.35);
      targetPosition.copy(orbitRight).multiplyScalar(panX).addScaledVector(orbitUp, panY);
    } else {
      targetYaw += (event.clientX - dragX) / width * 3;
      targetPitch = THREE.MathUtils.clamp(targetPitch + (event.clientY - dragY) / width * 1.5, -0.12, 0.18);
    }
    dragX = event.clientX; dragY = event.clientY;
    if (reduced) { model.rotation.set(targetPitch, targetYaw, 0); model.position.copy(targetPosition); pose(time); draw(); }
  }
  function pointerUp(event: PointerEvent) {
    if (dragId !== event.pointerId) return;
    dragId = null; canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }
  function resetView() {
    targetYaw = targetPitch = 0;
    panX = panY = 0; targetPosition.set(0, 0, 0);
    if (reduced) { model.rotation.set(0, 0, 0); model.position.set(0, 0, 0); pose(time); draw(); }
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('lostpointercapture', pointerUp);
  canvas.addEventListener('dblclick', resetView);
  let time = 0, last = 0, raf = 0, disposed = false, reduced = false, visible = true, lost = false;
  let textureRequest = 0;
  let catalogue: readonly string[] = [];
  const loadedTextures = new Map<string, THREE.Texture>();
  const textureLoads = new Map<string, Promise<THREE.Texture>>();
  const loader = new THREE.TextureLoader();
  const ease = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  function pose(elapsed: number) {
    model.updateWorldMatrix(true, false);
    model.getWorldQuaternion(billboardRotation).invert().multiply(camera.quaternion);
    arrivalRing.quaternion.copy(billboardRotation);
    const t = reduced ? 6.5 : elapsed % cycleDuration;
    orbitLights.forEach((light, index) => {
      orbitPosition(reduced ? 2 : elapsed + 4.4, index, light.position).addScaledVector(orbitNormal, -4);
      light.scale.setScalar(reduced ? 1 : 1 + Math.sin(elapsed * 2 + index) * 0.12);
    });
    const available = catalogue.filter(url => loadedTextures.has(url));
    const count = Math.min(products.length, available.length);
    const offset = Math.floor(elapsed / cycleDuration) * products.length;
    productMaterials.forEach((material, index) => {
      const url = available[(offset + index) % available.length];
      const texture = loadedTextures.get(url) ?? null;
      if (material.map !== texture) { material.map = texture; material.needsUpdate = true; }
      products[index].userData.productImage = url;
    });
    let walking = 0;
    shopper.visible = t < 3.7 || t >= 5;
    shopper.scale.setScalar(1);
    if (t < 2.8) {
      shopper.position.lerpVectors(incoming, doorstep, ease(t / 2.8));
      shopper.rotation.y = -1.35 + ease((t - 2) / 0.8) * (1.35 - Math.PI);
      walking = Math.sin(Math.PI * Math.min(t / 0.4, 1) / 2);
    } else if (t < 3.7) {
      shopper.position.lerpVectors(doorstep, inside, ease((t - 2.8) / 0.9)); shopper.rotation.y = Math.PI; walking = 1;
    } else if (t < 5) shopper.position.copy(inside);
    else if (t < 5.65) {
      shopper.position.lerpVectors(inside, doorstep, ease((t - 5) / 0.65)); shopper.rotation.y = 0; walking = 1;
    } else if (t < 6.1) {
      shopper.position.lerpVectors(doorstep, collect, ease((t - 5.65) / 0.45)); shopper.rotation.y = Math.sin((t - 5.65) / 0.45 * Math.PI) * 0.7 + 0.18; walking = 1 - ease((t - 5.9) / 0.2);
    } else if (t < 10.5) {
      shopper.position.copy(collect); shopper.rotation.y = 0.18;
    } else {
      shopper.position.lerpVectors(collect, outgoing, ease((t - 10.5) / 2.7)); shopper.rotation.y = 0.18 + ease((t - 10.5) / 0.5) * 1.1;
      walking = (1 - ease((t - 12.7) / 0.5)) * ease((t - 10.5) / 0.3);
      shopper.scale.setScalar(1 - ease((t - 13.2) / 0.8));
    }
    if (t < 0.5) shopper.scale.setScalar(ease(t / 0.5));
    const stride = Math.sin(t * 9) * 0.3 * walking;
    legs[0].rotation.x = stride; legs[1].rotation.x = -stride;
    arms[0].rotation.x = -stride * 0.65; arms[1].rotation.x = stride * 0.3;
    shopper.position.y += Math.abs(Math.sin(t * 9)) * 0.016 * walking;
    torso.rotation.z = Math.sin(t * 5) * 0.025 * walking;
    const receiving = ease((t - 6) / 0.3) * (1 - ease((t - 10) / 0.4));
    arms[1].rotation.z = -receiving * 0.3;
    head.rotation.y = (Math.sin(t * 1.5) * 0.08 - Math.sin(ease((t - 6.1) / 1.2) * Math.PI) * 0.3) * (1 - walking);
    const blink = Math.pow(Math.max(0, Math.cos(t * Math.PI / 2)), 60);
    eyes.forEach(eye => { eye.scale.y = reduced ? 1 : 1 - blink * 0.85; });
    const doorOpen = Math.max(ease((t - 1.9) / 0.7) * (1 - ease((t - 3.8) / 0.65)), ease((t - 4.7) / 0.5) * (1 - ease((t - 6.1) / 0.7)));
    door.rotation.y = -doorOpen * 1.55;
    awning.rotation.x = Math.sin(t * 1.3) * 0.012;
    tote.scale.setScalar(1 + Math.sin(t * 3) * 0.015 * receiving);
    shopper.updateWorldMatrix(true, true);
    tote.localToWorld(bagTarget.set(0, 0.2, 0));
    model.worldToLocal(bagTarget);
    const firstArrival = flightBegins + flightDuration;
    const lastArrival = Math.min(count - 1, Math.floor((t - firstArrival) / flightSpacing));
    const sparkleTime = lastArrival < 0 ? -1 : t - (firstArrival + lastArrival * flightSpacing);
    const arrivalProgress = THREE.MathUtils.clamp(sparkleTime / 0.6, 0, 1);
    arrivalRing.visible = !reduced && sparkleTime >= 0 && sparkleTime < 0.6;
    arrivalRing.position.copy(bagTarget).addScaledVector(orbitNormal, 0.15);
    arrivalRing.scale.setScalar(0.6 + arrivalProgress * 2.2);
    arrivalMaterial.opacity = (1 - arrivalProgress) * 0.55;
    glints.forEach((glint, index) => {
      glint.visible = !reduced && sparkleTime >= 0 && sparkleTime < 0.6;
      const progress = THREE.MathUtils.clamp(sparkleTime / 0.6, 0, 1);
      const angle = index / glints.length * Math.PI * 2;
      glint.position.copy(bagTarget).add(new THREE.Vector3(Math.cos(angle) * (0.08 + progress * 0.24), Math.sin(angle) * 0.12 + progress * 0.3, 0.1));
      glint.scale.setScalar(Math.sin(progress * Math.PI)); glint.rotation.y = progress * Math.PI;
    });
    products.forEach((product, index) => {
      const departure = flightBegins + index * flightSpacing;
      const duration = flightDuration;
      const progress = ease((t - departure) / duration);
      product.visible = index < count && !!productMaterials[index].map && t < departure + duration;
      const orbitTime = reduced ? 1.4 : elapsed;
      orbitPosition(orbitTime, index, product.position);
      product.quaternion.copy(billboardRotation);
      product.rotateZ(Math.sin(t * 1.3 + index * 2) * 0.085);
      product.scale.setScalar(0.8 * ease(t / 0.7));
      trails[index].forEach(dot => { dot.visible = false; });
      if (!reduced && t >= departure) {
        const departureTime = elapsed - t + departure;
        orbitPosition(departureTime, index, flightStart);
        orbitPosition(departureTime + 0.1, index, flightNext);
        controlOne.copy(flightNext).sub(flightStart).normalize().multiplyScalar(0.85).add(flightStart);
        controlTwo.copy(bagTarget).addScaledVector(orbitUp, 0.85).addScaledVector(orbitNormal, 0.55);
        flight.v3.copy(bagTarget);
        flight.getPoint(progress, product.position);
        product.rotateZ(Math.sin(progress * Math.PI) * (index % 2 ? -0.22 : 0.22));
        product.scale.setScalar(0.8 * (1 - ease((progress - 0.45) / 0.55)));
        trails[index].forEach((dot, j) => {
          const tail = progress - (j + 1) * 0.025;
          dot.visible = product.visible && tail > 0;
          flight.getPoint(Math.max(0, tail), dot.position);
          dot.scale.setScalar((1 - j / 11) * 0.8);
          (dot.material as THREE.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * (1 - j / 11) * 0.55;
        });
      }
    });
  }
  function draw() { if (!disposed && !lost) renderer.render(scene, camera); }
  function active() { return !disposed && !lost && visible && !document.hidden && !reduced; }
  function tick(now: number) {
    raf = 0; if (!active()) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
    const phase = time % cycleDuration;
    const walkingPhase = phase < 3.7 || (phase >= 5 && phase < 6.1) || phase >= 10.5;
    time += dt * (walkingPhase ? 0.85 : 0.7);
    model.rotation.y = THREE.MathUtils.damp(model.rotation.y, targetYaw, 12, dt);
    model.rotation.x = THREE.MathUtils.damp(model.rotation.x, targetPitch, 12, dt);
    model.position.lerp(targetPosition, 1 - Math.exp(-16 * dt));
    pose(time); draw(); raf = requestAnimationFrame(tick);
  }
  function sync() { cancelAnimationFrame(raf); raf = 0; last = 0; pose(time); draw(); if (active()) raf = requestAnimationFrame(tick); }
  function resize() {
    const { width, height } = host.getBoundingClientRect(); if (!width || !height || disposed) return;
    const aspect = width / height;
    const halfWidth = Math.max(3.25, 2.05 * aspect), halfHeight = halfWidth / aspect;
    camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix(); renderer.setSize(width, height); pose(time); draw();
  }
  function contextLost(event: Event) { event.preventDefault(); lost = true; cancelAnimationFrame(raf); onFailure(); }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }); observer.observe(host);
  document.addEventListener('visibilitychange', sync);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  resize(); sync();
  return {
    setProducts(images) {
      const request = ++textureRequest;
      catalogue = [...new Set(images)]; time = 0;
      sync();
      catalogue.forEach(url => {
        let pending = textureLoads.get(url);
        if (!pending) {
          pending = loader.loadAsync(url).then(texture => {
            if (disposed) { texture.dispose(); return texture; }
            // Trim only near-white empty margins, keeping all product pixels and labels.
            const image = texture.image as HTMLImageElement;
            const sample = document.createElement('canvas'); sample.width = sample.height = 192;
            const sampleContext = sample.getContext('2d', { willReadFrequently: true })!;
            sampleContext.fillStyle = '#FFFFFF'; sampleContext.fillRect(0, 0, 192, 192);
            sampleContext.drawImage(image, 0, 0, 192, 192);
            const pixels = sampleContext.getImageData(0, 0, 192, 192).data;
            let left = 192, right = 0, top = 192, bottom = 0;
            for (let y = 0; y < 192; y++) for (let x = 0; x < 192; x++) {
              const p = (y * 192 + x) * 4;
              if (Math.min(pixels[p], pixels[p + 1], pixels[p + 2]) < 239) {
                left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
              }
            }
            // A small buffer keeps pale edges; near-white/empty photos stay uncropped.
            const valid = right - left > 8 && bottom - top > 8;
            const sx = valid ? Math.max(0, left - 5) / 192 * image.width : 0;
            const sy = valid ? Math.max(0, top - 5) / 192 * image.height : 0;
            const sw = valid ? Math.min(image.width - sx, (right - left + 11) / 192 * image.width) : image.width;
            const sh = valid ? Math.min(image.height - sy, (bottom - top + 11) / 192 * image.height) : image.height;
            const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
            const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 512, 512);
            ctx.imageSmoothingQuality = 'high';
            const scale = Math.min(488 / sw, 488 / sh);
            ctx.drawImage(image, sx, sy, sw, sh, (512 - sw * scale) / 2, (512 - sh * scale) / 2, sw * scale, sh * scale);
            const productTexture = new THREE.CanvasTexture(canvas);
            productTexture.colorSpace = THREE.SRGBColorSpace;
            productTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
            texture.dispose(); textures.add(productTexture); loadedTextures.set(url, productTexture); return productTexture;
          });
          textureLoads.set(url, pending);
        }
        void pending.then(() => {
          if (disposed || request !== textureRequest) return;
          pose(time); draw();
        }).catch(() => { textureLoads.delete(url); });
      });
    },
    setReducedMotion(value) { reduced = value; sync(); },
    dispose() {
      disposed = true; textureRequest++; cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('lostpointercapture', pointerUp);
      canvas.removeEventListener('dblclick', resetView);
      if (dragId !== null && canvas.hasPointerCapture(dragId)) canvas.releasePointerCapture(dragId);
      resizeObserver.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', sync);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); textureLoads.clear(); loadedTextures.clear();
      light.shadow.dispose(); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
