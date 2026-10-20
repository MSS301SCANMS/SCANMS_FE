import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createShoppingProducts, shoppingProductTurn } from './shopping-products';

export interface ShoppingSceneController {
  setPaused: (paused: boolean) => void;
  toggleGift: () => void;
  toggleProduct: (index: number) => void;
  toggleBag: (index: number) => void;
  dispose: () => void;
}

/** Locally modelled shopping objects; no remote models, tracking or runtime assets. */
export function createShoppingScene(host: HTMLElement, onContextLost: () => void): ShoppingSceneController {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.5), 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 2.7, 11.8);
  camera.lookAt(0, 0.25, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x796348, 0.55));
  const key = new THREE.DirectionalLight(0xfff5df, 2.5);
  key.position.set(-4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 });
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(4, 3, -4);
  scene.add(rim);

  const gold = new THREE.MeshPhysicalMaterial({ color: '#C59B58', metalness: 0.8, roughness: 0.22, clearcoat: 0.35, clearcoatRoughness: 0.24 });
  const satin = new THREE.MeshPhysicalMaterial({ color: '#B88E4F', metalness: 0.55, roughness: 0.28, side: THREE.DoubleSide, sheen: 0.7, sheenColor: new THREE.Color('#FBF5EB') });
  const paper = new THREE.MeshStandardMaterial({ color: '#F3EFE6', roughness: 0.68, metalness: 0.03 });
  const white = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.5 });
  const sand = new THREE.MeshStandardMaterial({ color: '#EEDFC6', roughness: 0.6 });
  const bagGold = new THREE.MeshPhysicalMaterial({ color: '#B88E4F', roughness: 0.36, metalness: 0.28, clearcoat: 0.22, clearcoatRoughness: 0.32 });
  const bagFold = new THREE.MeshStandardMaterial({ color: '#8F6936', roughness: 0.48, metalness: 0.12 });
  const rope = new THREE.MeshStandardMaterial({ color: '#231D15', roughness: 0.65 });
  const root = new THREE.Group();
  scene.add(root);

  function box(parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0, radius = 0.05) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cord(parent: THREE.Object3D, points: number[][], radius = 0.025, material: THREE.Material = gold) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 8, false), material);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const textures: THREE.Texture[] = [];
  // Fine paper grain is generated locally, and never alters the brand imagery.
  const grainData = new Uint8Array(128 * 128 * 4);
  let seed = 37;
  for (let i = 0; i < grainData.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const shade = 100 + (seed % 90);
    grainData.set([shade, shade, shade, 255], i);
  }
  const grain = new THREE.DataTexture(grainData, 128, 128);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(5, 5);
  grain.needsUpdate = true;
  textures.push(grain);
  paper.bumpMap = grain;
  paper.bumpScale = 0.006;
  white.bumpMap = grain;
  white.bumpScale = 0.004;
  bagGold.bumpMap = grain;
  bagGold.bumpScale = 0.009;
  function label(text: string, color: string, width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 1536; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 270px Georgia, serif';
    ctx.fillText(text, 768, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(texture);
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
  }

  // Open paper bag: four separate faces, a bottom and two rope handles.
  const bag = new THREE.Group();
  bag.position.set(-0.58, 0.12, -0.18);
  bag.scale.set(1.18, 1, 1.08);
  bag.rotation.set(-0.05, -0.38, -0.1);
  root.add(bag);
  box(bag, 2.05, 2.15, 0.045, bagGold, 0, 0, 0.5, 0.018);
  box(bag, 2.05, 2.15, 0.045, bagGold, 0, 0, -0.5, 0.018);
  box(bag, 0.045, 2.15, 1, bagFold, -1.01, 0, 0, 0.018);
  box(bag, 0.045, 2.15, 1, bagFold, 1.01, 0, 0, 0.018);
  box(bag, 2.05, 0.045, 1, bagFold, 0, -1.07);
  const bagHandles = [-0.48, 0.53].map(z => {
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.87, z);
    bag.add(pivot);
    cord(pivot, [[-0.52, 0, 0], [-0.52, 0.63, 0], [0, 0.86, 0], [0.52, 0.63, 0], [0.52, 0, 0]], 0.035, rope);
    return pivot;
  });
  const wordmark = label('ScanMS', '#FFF9E8', 1.88, 0.62);
  wordmark.position.set(0, -0.08, 0.526);
  bag.add(wordmark);
  box(bag, 0.46, 0.018, 0.006, paper, 0, -0.46, 0.528, 0.002);
  // Recessed foil border adds definition without filling the face with decoration.
  for (const x of [-0.91, 0.91]) box(bag, 0.012, 1.93, 0.006, gold, x, 0, 0.528, 0.002);
  for (const y of [-0.96, 0.96]) box(bag, 1.82, 0.012, 0.006, gold, 0, y, 0.528, 0.002);
  // Folded top hems and metal eyelets give the paper bag a finished edge.
  for (const z of [-0.505, 0.505]) {
    box(bag, 2.04, 0.07, 0.065, bagFold, 0, 1.045, z, 0.012);
    for (const x of [-0.52, 0.52]) {
      const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.053, 0.011, 8, 24), gold);
      eyelet.position.set(x, 0.87, z + Math.sign(z) * 0.027);
      bag.add(eyelet);
    }
  }

  // Gift with a raised lid, crossed satin bands and curved bow loops.
  const gift = new THREE.Group();
  gift.name = 'interactive-gift';
  gift.position.set(1.65, -0.6, 0.9);
  gift.scale.setScalar(1.18);
  gift.rotation.set(0.02, -0.32, 0.04);
  root.add(gift);
  // Hollow box and a separate lid allow a real opening instead of scaling a solid cube.
  box(gift, 1.42, 1.04, 0.065, white, 0, 0, 0.57, 0.02);
  box(gift, 1.42, 1.04, 0.065, paper, 0, 0, -0.57, 0.02);
  box(gift, 0.065, 1.04, 1.18, paper, -0.69, 0);
  box(gift, 0.065, 1.04, 1.18, paper, 0.69, 0);
  box(gift, 1.42, 0.08, 1.18, sand, 0, -0.5);
  box(gift, 0.19, 1.04, 0.013, gold, 0, 0, 0.608, 0.003);
  // Matte warm-gold letters stay attached to the front face, above the ribbon.
  const giftWordmark = new THREE.Group();
  giftWordmark.name = 'gift-wordmark';
  giftWordmark.position.set(0, -0.035, 0.633);
  gift.add(giftWordmark);
  const giftLetters = [...'SCANMS'].map((character, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 320;
    const context = canvas.getContext('2d')!;
    context.font = 'bold 210px Georgia, serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    // A fine ivory edge keeps the lettering legible across the gold ribbon.
    context.lineWidth = 7; context.strokeStyle = '#FFF9EE';
    context.lineJoin = 'round'; context.strokeText(character, 128, 171);
    context.fillStyle = '#B88E4F'; context.fillText(character, 128, 171);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(texture);
    const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.215, 0.32),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
    letter.name = `gift-letter-${index}-${character}`;
    letter.position.x = (index - 2.5) * 0.185;
    giftWordmark.add(letter);
    return letter;
  });
  function floatGiftLetters(time: number) {
    giftLetters.forEach((letter, index) => {
      const phase = time * 1.65 + index * Math.PI;
      letter.position.y = Math.cos(phase) * 0.052;
      letter.rotation.z = Math.sin(phase) * 0.045;
    });
  }
  floatGiftLetters(0);
  const lid = new THREE.Group();
  lid.name = 'gift-lid';
  gift.add(lid);
  lid.position.set(0.05, 0.95, -0.02);
  lid.rotation.set(-0.1, 0.04, -0.1);
  box(lid, 1.52, 0.19, 1.28, paper);
  box(lid, 0.19, 0.205, 1.3, gold, 0, 0, 0, 0.008);
  box(lid, 1.54, 0.021, 0.18, gold, 0, 0.104, 0, 0.006);
  for (const dir of [-1, 1]) {
    // Broad, twisted satin loops catch moving highlights along their edges.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.16, 0), new THREE.Vector3(dir * 0.39, 0.57, -0.02),
      new THREE.Vector3(dir * 0.63, 0.28, 0.04), new THREE.Vector3(0, 0.14, 0.06),
    ]);
    const bowGeometry = new THREE.PlaneGeometry(1, 1, 36, 1);
    const attribute = bowGeometry.attributes.position as THREE.BufferAttribute;
    for (let row = 0; row < 2; row++) for (let i = 0; i <= 36; i++) {
      const u = i / 36;
      const point = curve.getPoint(u);
      const edge = (row - 0.5) * 0.18;
      attribute.setXYZ(row * 37 + i, point.x, point.y + edge * Math.sin(u * Math.PI), point.z + edge * Math.cos(u * Math.PI));
    }
    bowGeometry.computeVertexNormals();
    const loop = new THREE.Mesh(bowGeometry, satin);
    loop.castShadow = true;
    lid.add(loop);
  }
  box(lid, 0.2, 0.14, 0.18, gold, 0, 0.19, 0);
  const tails = [-1, 1].map(dir => {
    const geometry = new THREE.PlaneGeometry(1, 1, 28, 1);
    const mesh = new THREE.Mesh(geometry, satin);
    lid.add(mesh);
    return { geometry, dir };
  });
  function flutterBow(time: number) {
    for (const { geometry, dir } of tails) {
      const pos = geometry.attributes.position as THREE.BufferAttribute;
      for (let row = 0; row < 2; row++) for (let i = 0; i <= 28; i++) {
        const u = i / 28;
        const wave = Math.sin(u * 7 - time * 1.8 + dir) * u * 0.055;
        pos.setXYZ(row * 29 + i, dir * (u * 0.4 + 0.035) + (row - 0.5) * 0.17,
          0.14 - u * u * 0.56 + wave, u * 0.7 + Math.sin(u * 4) * 0.07);
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }
  flutterBow(0);
  // Keep the lid behind the merchandise flight corridor, including the static view.
  lid.position.set(-0.12, 1.25, -0.96);
  lid.rotation.set(0.18, 0.06, -0.14);

  const smallBag = new THREE.Group();
  smallBag.position.set(-2.05, -0.53, 0.95);
  smallBag.scale.setScalar(1.1);
  smallBag.rotation.set(0, 0.28, -0.2);
  root.add(smallBag);
  // Separate walls leave a real opening for the lipstick to emerge through.
  box(smallBag, 0.92, 0.86, 0.035, paper, 0, 0, 0.307, 0.012);
  box(smallBag, 0.92, 0.86, 0.035, paper, 0, 0, -0.307, 0.012);
  box(smallBag, 0.035, 0.86, 0.65, paper, -0.443, 0, 0, 0.012);
  box(smallBag, 0.035, 0.86, 0.65, paper, 0.443, 0, 0, 0.012);
  box(smallBag, 0.92, 0.035, 0.65, sand, 0, -0.413, 0, 0.012);
  const smallHandle = new THREE.Group();
  smallHandle.position.set(0, 0.33, 0.33);
  smallBag.add(smallHandle);
  cord(smallHandle, [[-0.23, 0, 0], [-0.22, 0.45, 0], [0.22, 0.45, 0], [0.23, 0, 0]], 0.026, gold);
  const smallMark = label('ScanMS', '#8F6936', 0.75, 0.25);
  smallMark.position.set(0, -0.04, 0.328);
  smallBag.add(smallMark);
  const orbitDepthPoint = new THREE.Vector3();
  const orbitDirection = new THREE.Vector3();
  const flightPoint = new THREE.Vector3();
  const showcase = host.closest('.login-showcase');
  const showcaseCopy = showcase?.querySelector('.login-showcase-copy');
  const headlineRange = document.createRange();
  const flightEase = (value: number) => {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  const merchandise = createShoppingProducts(gift, gold, bag, smallBag, (angle, point) => {
    // Camera-facing outer ring: surround all three containers, with safe edge margins.
    camera.getWorldDirection(orbitDirection);
    orbitDepthPoint.copy(camera.position).addScaledVector(orbitDirection, camera.position.z * 0.76).project(camera);
    point.set(Math.cos(angle) * 0.81, Math.sin(angle) * 0.68, orbitDepthPoint.z).unproject(camera);
  }, (model, departure, progress) => {
    const container = model.parent!;
    const rect = host.getBoundingClientRect();
    const frame = showcase?.getBoundingClientRect() ?? rect;
    container.updateWorldMatrix(true, false);
    flightPoint.copy(departure);
    container.localToWorld(flightPoint).project(camera);
    const depth = flightPoint.z;
    const fromX = rect.left + (flightPoint.x + 1) * rect.width / 2;
    const fromY = rect.top + (1 - flightPoint.y) * rect.height / 2;
    // Measure the actual lettering, not the full-width heading block. Keep a
    // product-sized margin around both headline and badge at every breakpoint.
    let copyRight = rect.left;
    let copyBottom = rect.top;
    showcaseCopy?.querySelectorAll('h1, .login-showcase-eyebrow').forEach(element => {
      headlineRange.selectNodeContents(element);
      const bounds = headlineRange.getBoundingClientRect();
      copyRight = Math.max(copyRight, bounds.right);
      copyBottom = Math.max(copyBottom, bounds.bottom);
    });
    const clearance = THREE.MathUtils.clamp(rect.width * 0.1, 28, 70);
    const safeX = copyRight + clearance;
    const laneX = Math.min(frame.right - clearance, Math.max(safeX, fromX + rect.width * 0.22));
    const topExit = frame.top - clearance * 1.5;
    const bottomEntry = frame.bottom + clearance * 1.5;
    let x: number;
    let y: number;
    if (progress < 0.52) {
      const u = progress / 0.52;
      // Sweep right below the lettering, then climb through the empty corridor.
      // Overlapping eased axes round the turn without stopping at a waypoint.
      const sweep = flightEase(u / 0.4);
      const climb = flightEase((u - 0.34) / 0.66);
      const shoulderY = fromY - Math.min(20, Math.max(0, fromY - copyBottom - clearance));
      x = THREE.MathUtils.lerp(fromX, laneX, sweep) + Math.sin(climb * Math.PI) * 12;
      y = THREE.MathUtils.lerp(fromY, shoulderY, sweep) + (topExit - shoulderY) * climb;
    } else {
      // Recycle beyond the illustration's clipped edges, then sweep back inside.
      const u = (progress - 0.52) / 0.48;
      const t = u * u * (3 - 2 * u);
      const v = 1 - t;
      const besideCopy = fromY < copyBottom + clearance;
      const leftX = Math.max(besideCopy ? safeX : rect.left + clearance, fromX - Math.min(150, rect.width * 0.24));
      const returnY = besideCopy ? fromY : Math.max(copyBottom + clearance, fromY - 100);
      x = v * v * v * laneX + 3 * v * v * t * laneX + 3 * v * t * t * leftX + t * t * t * fromX;
      y = v * v * v * bottomEntry + 3 * v * v * t * (fromY + 100) + 3 * v * t * t * returnY + t * t * t * fromY;
    }
    flightPoint.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2, depth).unproject(camera);
    model.position.copy(container.worldToLocal(flightPoint));
  });
  textures.push(...merchandise.textures);

  // A transparent pass extends above the 3D canvas but stays inside the showcase.
  // It shares geometry/materials, ignores pointer events, and is removed on unmount.
  let flightRenderer: THREE.WebGLRenderer | undefined;
  let flightEnvironment: THREE.WebGLRenderTarget | undefined;
  const flightScene = new THREE.Scene();
  flightScene.environmentIntensity = scene.environmentIntensity;
  scene.children.filter(object => object instanceof THREE.Light).forEach(light => {
    const copy = light.clone();
    if (copy instanceof THREE.DirectionalLight) copy.castShadow = false;
    flightScene.add(copy);
  });
  const flightCamera = camera.clone();
  const flightCopies = merchandise.viewportProducts.map(product => {
    const copy = product.clone(true);
    flightScene.add(copy);
    return copy;
  });
  const flightVariantPairs = merchandise.viewportProducts.map((product, index) =>
    product.children.map((variant, childIndex) => ({ source: variant, copy: flightCopies[index].children[childIndex] })));
  let flightWidth = 0;
  let flightHeight = 0;
  function renderFlights() {
    const flying = merchandise.viewportProducts.some(product => product.visible && product.userData.viewportFlight);
    if (!flying || !visible || document.hidden || lost) {
      if (flightRenderer) flightRenderer.domElement.style.display = 'none';
      return;
    }
    if (!flightRenderer) {
      flightRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      flightRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      flightRenderer.outputColorSpace = renderer.outputColorSpace;
      flightRenderer.toneMapping = renderer.toneMapping;
      flightRenderer.toneMappingExposure = renderer.toneMappingExposure;
      // Render-target textures belong to their WebGL context; build this pass's own lighting.
      const flightPmrem = new THREE.PMREMGenerator(flightRenderer);
      const flightRoom = new RoomEnvironment();
      flightEnvironment = flightPmrem.fromScene(flightRoom, 0.04);
      flightScene.environment = flightEnvironment.texture;
      flightRoom.dispose(); flightPmrem.dispose();
      const canvas = flightRenderer.domElement;
      canvas.className = 'login-product-flight-overlay';
      canvas.setAttribute('aria-hidden', 'true');
      Object.assign(canvas.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '30' });
      document.body.appendChild(canvas);
    }
    const rect = host.getBoundingClientRect();
    const frame = showcase?.getBoundingClientRect() ?? rect;
    if (flightWidth !== window.innerWidth || flightHeight !== window.innerHeight) {
      flightWidth = window.innerWidth; flightHeight = window.innerHeight;
      flightRenderer.setSize(flightWidth, flightHeight);
    }
    flightRenderer.domElement.style.display = 'block';
    flightRenderer.domElement.style.clipPath = `inset(${Math.max(0, frame.top + 1)}px ${Math.max(0, window.innerWidth - frame.right + 1)}px ${Math.max(0, window.innerHeight - frame.bottom + 1)}px ${Math.max(0, frame.left + 1)}px round 22px)`;
    flightCamera.copy(camera);
    flightCamera.setViewOffset(rect.width, rect.height, -rect.left, -rect.top, flightWidth, flightHeight);
    merchandise.viewportProducts.forEach((product, i) => {
      const copy = flightCopies[i];
      copy.visible = product.visible && product.userData.viewportFlight === true;
      if (copy.visible) {
        flightVariantPairs[i].forEach(pair => { pair.copy.visible = pair.source.visible; });
        product.updateWorldMatrix(true, false);
        product.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);
      }
    });
    flightRenderer.render(flightScene, flightCamera);
  }

  // A single flowing ribbon passes behind the shopping objects. Its surface is
  // deformed each frame, so highlights follow the folds instead of a flat spin.
  const segments = 110;
  const ribbonGeometry = new THREE.PlaneGeometry(1, 1, segments, 1);
  const ribbon = new THREE.Mesh(ribbonGeometry, satin);
  root.add(ribbon);
  const positions = ribbonGeometry.attributes.position as THREE.BufferAttribute;
  function foldRibbon(time: number) {
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const angle = u * Math.PI * 1.85 - 0.25;
        const wave = Math.sin(u * 15 - time * 1.5);
        const edge = (row - 0.5) * 0.44;
        const twist = u * 11 + Math.sin(time * 0.9 + u * 6) * 0.6;
        const x = Math.cos(angle) * (2.85 + wave * 0.13);
        const y = Math.sin(angle) * 1.2 + wave * 0.22;
        const z = -0.95 + Math.sin(angle) * 0.5;
        positions.setXYZ(row * (segments + 1) + i, x, y + Math.cos(twist) * edge, z + Math.sin(twist) * edge);
      }
    }
    positions.needsUpdate = true;
    ribbonGeometry.computeVertexNormals();
  }
  foldRibbon(0);

  // A few folded paper accents share the same breeze, at different depths.
  const accents: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const mesh = box(root, 0.075, 0.24, 0.018, i % 2 ? paper : gold);
    mesh.position.set([-2.3, 2.3, -1.8, 1.9, 0.85][i], [1.55, 1.35, -0.25, -1.15, 2.1][i], -0.1);
    mesh.rotation.set(i * 0.7, i * 0.6, i * 1.5);
    accents.push(mesh);
  }

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.7, 0.18, 80), paper);
  pedestal.position.y = -1.62;
  pedestal.scale.set(1.04, 1, 0.6);
  pedestal.receiveShadow = false;
  scene.add(pedestal);
  const pedestalEdge = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.72, 0.035, 80), gold);
  pedestalEdge.position.y = -1.715;
  pedestalEdge.scale.set(1.04, 1, 0.6);
  scene.add(pedestalEdge);
  // Soft contact shadows expand as the objects lift, avoiding hard polygon shadows.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d')!;
  const gradient = shadowContext.createRadialGradient(64, 64, 3, 64, 64, 63);
  gradient.addColorStop(0, 'rgba(70,49,25,0.5)');
  gradient.addColorStop(0.35, 'rgba(70,49,25,0.24)');
  gradient.addColorStop(1, 'rgba(70,49,25,0)');
  shadowContext.fillStyle = gradient;
  shadowContext.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  textures.push(shadowTexture);
  const contacts = [bag, gift, smallBag].map((object, i) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0.85 }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(object.position.x, -1.523 + i * 0.001, object.position.z);
    mesh.scale.set(i === 0 ? 2.8 : 1.8, i === 0 ? 1.8 : 1.4, 1);
    scene.add(mesh);
    return mesh;
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.025 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.72;
  floor.receiveShadow = true;
  scene.add(floor);

  let disposed = false;
  let paused = false;
  let visible = true;
  let lost = false;
  let frame = 0;
  let time = 0;
  let last = 0;
  let hovering = false;
  let hoverAmount = 0;
  let lidLift = 1.25;
  let lidVelocity = 0;
  const pointer = new THREE.Vector2();
  const tilt = new THREE.Vector2();
  const canPoint = window.matchMedia('(hover: hover) and (pointer: fine)');
  const active = () => !disposed && !paused && visible && !document.hidden && !lost;
  function draw() {
    if (disposed || lost) return;
    const flying = merchandise.viewportProducts.filter(product => product.visible && product.userData.viewportFlight);
    flying.forEach(product => { product.visible = false; });
    renderer.render(scene, camera);
    flying.forEach(product => { product.visible = true; });
    renderFlights();
  }
  function tick(now: number) {
    frame = 0;
    if (!active()) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    time += dt;
    tilt.lerp(pointer, 1 - Math.exp(-dt * 4));
    hoverAmount += ((hovering ? 1 : 0) - hoverAmount) * (1 - Math.exp(-dt * 3));
    root.rotation.y = tilt.x * 0.24 + Math.sin(time * 0.4) * 0.055;
    root.rotation.x = -tilt.y * 0.09;
    bag.position.y = 0.12 + Math.sin(time * 0.85) * 0.12;
    bag.rotation.z = -0.1 + Math.sin(time * 0.65) * 0.055;
    bag.rotation.y = -0.38 + Math.sin(time * 0.55) * 0.07;
    gift.position.y = -0.6 + Math.sin(time * 0.95 + 1.4) * 0.1;
    gift.rotation.z = 0.04 + Math.sin(time * 0.8) * 0.035;
    floatGiftLetters(time);
    const opening = merchandise.update(time, dt);
    const bagTurn = shoppingProductTurn(time).turn % 3;
    bagHandles.forEach((handle, i) => {
      handle.rotation.x = Math.sin(time * 1.6 + i * 0.7) * (bagTurn === 1 ? 0.07 : 0.018);
    });
    smallHandle.rotation.x = Math.sin(time * 1.9) * (bagTurn === 2 ? 0.09 : 0.02);
    const liftTarget = 0.61 + opening * (0.64 + hoverAmount * 0.08);
    lidVelocity += ((liftTarget - lidLift) * 40 - lidVelocity * 11) * dt;
    lidLift += lidVelocity * dt;
    lid.position.y = lidLift;
    lid.position.x = -opening * 0.12;
    lid.position.z = -opening * 0.96;
    lid.rotation.z = -opening * (0.14 + hoverAmount * 0.04);
    lid.rotation.x = opening * 0.18;
    lid.rotation.y = opening * 0.06;
    smallBag.position.y = -0.53 + Math.sin(time * 1.05 + 3) * 0.16;
    smallBag.rotation.z = -0.17 + Math.sin(time * 0.7 + 2) * 0.09;
    accents.forEach((mesh, i) => {
      mesh.rotation.y = i * 0.6 + Math.sin(time * 0.7 + i) * 0.9;
      mesh.position.y = [1.55, 1.35, -0.25, -1.15, 2.1][i] + Math.sin(time * 0.9 + i * 1.5) * 0.16;
    });
    foldRibbon(time);
    flutterBow(time);
    contacts.forEach((contact, i) => {
      contact.material.opacity = 0.72 + Math.sin(time * 0.9 + i) * 0.1;
    });
    draw();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (active()) frame = requestAnimationFrame(tick);
    else draw();
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || disposed) return;
    camera.aspect = width / height;
    // Keep the entire composition inside both portrait and landscape frames.
    camera.position.z = Math.max(width < 300 ? 9.6 : 7.9, 10.6 / camera.aspect);
    camera.position.y = 1.85;
    camera.lookAt(0, 0.05, 0);
    camera.updateProjectionMatrix();
    merchandise.update(time, 0);
    renderer.setSize(width, height);
    draw();
  }
  function move(e: PointerEvent) {
    host.style.cursor = pick(e.clientX, e.clientY) ? 'pointer' : '';
    if (merchandise.isManual()) return;
    if (!canPoint.matches || !active()) return;
    hovering = true;
    const rect = host.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, (e.clientY - rect.top) / rect.height * 2 - 1);
  }
  function leave() { pointer.set(0, 0); hovering = false; host.style.cursor = ''; }
  const raycaster = new THREE.Raycaster();
  const hitPoint = new THREE.Vector2();
  function pick(x: number, y: number) {
    const rect = host.getBoundingClientRect();
    hitPoint.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(hitPoint, camera);
    const hit = raycaster.intersectObject(scene, true).find(hit => {
      let node: THREE.Object3D | null = hit.object;
      while (node) { if (!node.visible) return false; node = node.parent; }
      return true;
    });
    let ancestor: THREE.Object3D | null = hit?.object ?? null;
    while (ancestor && ancestor !== gift && ancestor !== bag && ancestor !== smallBag) ancestor = ancestor.parent;
    return ancestor ? hit : undefined;
  }
  function interact(index = -1, bagIndex = -1) {
    if (disposed || lost) return;
    if (bagIndex >= 0) merchandise.toggleBag(bagIndex);
    else if (index < 0) merchandise.toggleGift(); else merchandise.toggleProduct(index);
    pointer.set(0, 0); hovering = false;
    if (paused) {
      const opening = merchandise.update(time, 100);
      lidLift = 0.61 + opening * 0.64; lidVelocity = 0;
      lid.position.set(-opening * 0.12, lidLift, -opening * 0.96);
      lid.rotation.set(opening * 0.18, opening * 0.06, -opening * 0.14);
      draw();
    } else sync();
  }
  function click(event: MouseEvent) {
    const hit = pick(event.clientX, event.clientY);
    if (hit) interact(merchandise.productIndex(hit.object), merchandise.bagIndex(hit.object));
  }
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    if (flightRenderer) flightRenderer.domElement.style.display = 'none';
    sync();
    onContextLost();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  visibilityObserver.observe(host);
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', leave);
  host.addEventListener('click', click);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  document.addEventListener('visibilitychange', sync);
  resize();
  sync();

  return {
    toggleGift() { interact(); },
    toggleProduct(index) { interact(index); },
    toggleBag(index) { interact(-1, index); },
    setPaused(value) { paused = value; pointer.set(0, 0); hovering = false; sync(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('click', click);
      host.style.cursor = '';
      document.removeEventListener('visibilitychange', sync);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      textures.forEach(t => t.dispose());
      flightRenderer?.dispose();
      flightEnvironment?.dispose();
      flightRenderer?.domElement.remove();
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
