import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const SHOPPING_PRODUCT_SPEED = 1.5;
const BAG_FLIGHT_DURATION = 13.2 / 1.15;
const BAG_TURN_DURATION = BAG_FLIGHT_DURATION + 4.3;
const PRODUCT_TURN_DURATIONS = [8, BAG_TURN_DURATION, BAG_TURN_DURATION, 8, BAG_TURN_DURATION, BAG_TURN_DURATION, 8, BAG_TURN_DURATION, BAG_TURN_DURATION, 7];
const PRODUCT_CYCLE_DURATION = PRODUCT_TURN_DURATIONS.reduce((sum, duration) => sum + duration, 0);

/** Shared clock keeps the lid and bag handles aligned with each product. */
export function shoppingProductTurn(time: number) {
  const elapsed = time * SHOPPING_PRODUCT_SPEED + 2.8;
  let slot = elapsed % PRODUCT_CYCLE_DURATION;
  let turn = 0;
  while (turn < PRODUCT_TURN_DURATIONS.length - 1 && slot >= PRODUCT_TURN_DURATIONS[turn]) {
    slot -= PRODUCT_TURN_DURATIONS[turn++];
  }
  return { turn, slot, duration: PRODUCT_TURN_DURATIONS[turn], cycle: Math.floor(elapsed / PRODUCT_CYCLE_DURATION) };
}

/** Small, independently modelled merchandise sharing the gift's lighting/depth. */
export function createShoppingProducts(parent: THREE.Group, gold: THREE.Material, bag: THREE.Group, smallBag: THREE.Group, orbitPoint?: (angle: number, point: THREE.Vector3) => void, bagFlight?: (model: THREE.Group, departure: THREE.Vector3, progress: number) => void) {
  const ivory = new THREE.MeshPhysicalMaterial({ color: '#FFF9EE', roughness: 0.28, clearcoat: 0.55 });
  const charcoal = new THREE.MeshStandardMaterial({ color: '#231D15', roughness: 0.42 });
  const cushion = new THREE.MeshStandardMaterial({ color: '#42392D', roughness: 0.85 });
  const amber = new THREE.MeshPhysicalMaterial({ color: '#A76220', metalness: 0.08, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#FFF9E8', metalness: 0.08, roughness: 0.08, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1 });
  const all = new THREE.Group();
  all.name = 'flying-merchandise';
  parent.add(all);

  function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.castShadow = material !== glass;
    item.receiveShadow = true;
    group.add(item);
    return item;
  }
  function cylinder(group: THREE.Group, radius: number, height: number, material: THREE.Material, y: number) {
    return mesh(group, new THREE.CylinderGeometry(radius, radius, height, 40), material, 0, y);
  }
  function rounded(group: THREE.Group, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
    return mesh(group, new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.22), material, x, y, z);
  }
  const textures: THREE.Texture[] = [];
  function productLabel(group: THREE.Group, title: string, subtitle: string, width: number, height: number, y: number, z: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FBF5EB'; ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#C59B58'; ctx.lineWidth = 5; ctx.strokeRect(13, 13, 486, 230);
    ctx.fillStyle = '#231D15'; ctx.textAlign = 'center';
    ctx.font = 'bold 62px Georgia'; ctx.fillText(title, 256, 118);
    ctx.fillStyle = '#7D715E'; ctx.font = '22px sans-serif'; ctx.fillText(subtitle, 256, 172);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.push(map);
    mesh(group, new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map, roughness: 0.7 }), 0, y, z);
  }

  const serum = new THREE.Group(); serum.name = 'serum-bottle';
  cylinder(serum, 0.205, 0.61, amber, -0.06);
  cylinder(serum, 0.214, 0.04, gold, -0.35);
  cylinder(serum, 0.219, 0.61, glass, -0.055);
  mesh(serum, new THREE.SphereGeometry(0.204, 32, 16), amber, 0, 0.24).scale.set(1, 0.48, 1);
  cylinder(serum, 0.115, 0.16, gold, 0.37);
  cylinder(serum, 0.08, 0.19, ivory, 0.52);
  mesh(serum, new THREE.SphereGeometry(0.08, 24, 12), ivory, 0, 0.615);
  productLabel(serum, 'SERUM', 'SKIN CARE', 0.34, 0.23, -0.07, 0.219);
  all.add(serum);

  const cream = new THREE.Group(); cream.name = 'cream-jar';
  cylinder(cream, 0.3, 0.35, ivory, -0.03);
  cylinder(cream, 0.308, 0.07, glass, -0.18);
  cylinder(cream, 0.317, 0.105, gold, 0.19);
  cylinder(cream, 0.292, 0.025, ivory, 0.25);
  productLabel(cream, 'CREAM', 'DAILY CARE', 0.42, 0.16, -0.025, 0.301);
  all.add(cream);

  const headphones = new THREE.Group(); headphones.name = 'headphones';
  const bandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, -0.08, 0), new THREE.Vector3(-0.37, 0.26, 0),
    new THREE.Vector3(-0.24, 0.52, 0), new THREE.Vector3(0, 0.61, 0),
    new THREE.Vector3(0.24, 0.52, 0), new THREE.Vector3(0.37, 0.26, 0), new THREE.Vector3(0.34, -0.08, 0),
  ]);
  mesh(headphones, new THREE.TubeGeometry(bandCurve, 48, 0.052, 10, false), charcoal);
  for (const side of [-1, 1]) {
    rounded(headphones, 0.045, 0.25, 0.09, gold, side * 0.35, 0.08);
    const cup = rounded(headphones, 0.21, 0.37, 0.28, charcoal, side * 0.35, -0.17);
    cup.rotation.z = side * -0.15;
    rounded(headphones, 0.065, 0.28, 0.22, cushion, side * 0.24, -0.17);
    rounded(headphones, 0.027, 0.21, 0.16, gold, side * 0.46, -0.16);
  }
  headphones.scale.setScalar(0.92);
  all.add(headphones);

  const perfume = new THREE.Group(); perfume.name = 'bag-perfume';
  const champagne = new THREE.MeshPhysicalMaterial({ color: '#DEB86E', metalness: 0.38, roughness: 0.3, clearcoat: 0.65 });
  const honey = new THREE.MeshPhysicalMaterial({ color: '#E3B875', metalness: 0.03, roughness: 0.23, clearcoat: 1, clearcoatRoughness: 0.16 });
  rounded(perfume, 0.56, 0.57, 0.32, honey, 0, -0.05);
  rounded(perfume, 0.59, 0.59, 0.35, glass, 0, -0.05);
  cylinder(perfume, 0.1, 0.1, champagne, 0.28);
  rounded(perfume, 0.23, 0.2, 0.22, champagne, 0, 0.42);
  productLabel(perfume, 'PARFUM', 'SCANMS', 0.4, 0.24, -0.04, 0.18);
  bag.add(perfume);

  const lipstick = new THREE.Group(); lipstick.name = 'bag-lipstick';
  cylinder(lipstick, 0.105, 0.29, ivory, -0.08);
  cylinder(lipstick, 0.109, 0.035, champagne, -0.21);
  cylinder(lipstick, 0.109, 0.045, champagne, 0.065);
  cylinder(lipstick, 0.085, 0.16, champagne, 0.16);
  const rose = new THREE.MeshPhysicalMaterial({ color: '#A34C40', roughness: 0.32, clearcoat: 0.25 });
  const bullet = new THREE.CylinderGeometry(0.066, 0.07, 0.22, 32);
  const vertices = bullet.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    if (vertices.getY(i) > 0) vertices.setY(i, vertices.getY(i) + vertices.getX(i) * 0.65);
  }
  bullet.computeVertexNormals();
  mesh(lipstick, bullet, rose, 0, 0.32);
  smallBag.add(lipstick);

  const models = [serum, cream, headphones, perfume, lipstick];
  // Five flight slots keep the established choreography. Each slot carries a
  // rotating assortment modelled after products in SCANMS's public catalogue.
  const variants = models.map(model => {
    const original = new THREE.Group();
    original.name = `${model.name}-original`;
    [...model.children].forEach(child => original.add(child));
    model.add(original);
    return [original];
  });
  function variant(slot: number, sku: string, title: string) {
    const group = new THREE.Group();
    group.name = `catalog-${sku}`;
    group.userData.productTitle = title;
    group.visible = false;
    variants[slot].push(group);
    models[slot].add(group);
    return group;
  }
  const silver = new THREE.MeshPhysicalMaterial({ color: '#D5D2CA', metalness: 0.55, roughness: 0.3, clearcoat: 0.3 });
  const kraft = new THREE.MeshStandardMaterial({ color: '#D4B57E', roughness: 0.8 });
  const oat = new THREE.MeshStandardMaterial({ color: '#C99C5F', roughness: 0.9 });
  const ampoule = variant(0, 'LL-AMPOULE-PEP', 'Ampoule Multi-Peptide Lumière');
  cylinder(ampoule, 0.2, 0.58, ivory, -0.06);
  mesh(ampoule, new THREE.SphereGeometry(0.2, 24, 12), ivory, 0, 0.22).scale.set(1, 0.55, 1);
  cylinder(ampoule, 0.115, 0.14, ivory, 0.34);
  cylinder(ampoule, 0.075, 0.17, ivory, 0.49);
  mesh(ampoule, new THREE.SphereGeometry(0.075, 20, 10), ivory, 0, 0.575);
  productLabel(ampoule, 'PEPTIDE', 'LUMIERE', 0.33, 0.26, -0.06, 0.204);

  const sunscreen = variant(1, 'SS-SUN-60ML', 'Kem chống nắng Sora Skin SPF50+');
  rounded(sunscreen, 0.4, 0.65, 0.21, ivory, 0, 0.03);
  rounded(sunscreen, 0.38, 0.15, 0.22, champagne, 0, -0.36);
  rounded(sunscreen, 0.4, 0.025, 0.19, ivory, 0, 0.36);
  productLabel(sunscreen, 'SPF 50+', 'SORA SKIN', 0.32, 0.26, 0.04, 0.112);

  const earbuds = variant(2, 'TECH-ANC-001', 'Tai nghe True Wireless ANC Pro X');
  rounded(earbuds, 0.7, 0.32, 0.4, ivory, 0, -0.16);
  rounded(earbuds, 0.62, 0.035, 0.33, cushion, 0, 0.01);
  const caseLid = rounded(earbuds, 0.7, 0.3, 0.065, ivory, 0, 0.2, -0.17);
  caseLid.rotation.x = -0.25;
  for (const side of [-1, 1]) {
    mesh(earbuds, new THREE.SphereGeometry(0.11, 24, 12), ivory, side * 0.17, 0.12, 0.03);
    rounded(earbuds, 0.09, 0.23, 0.1, ivory, side * 0.17, 0.03, 0.1);
    mesh(earbuds, new THREE.SphereGeometry(0.045, 16, 8), cushion, side * 0.1, 0.13, 0.03);
  }
  rounded(earbuds, 0.08, 0.016, 0.008, champagne, 0, -0.12, 0.205);

  const thermos = variant(3, 'P05', 'Bình giữ nhiệt Bắc Âu 500ml');
  cylinder(thermos, 0.17, 0.62, silver, -0.08);
  mesh(thermos, new THREE.CylinderGeometry(0.1, 0.17, 0.23, 32), silver, 0, 0.345);
  cylinder(thermos, 0.102, 0.06, cushion, 0.48);
  cylinder(thermos, 0.112, 0.17, silver, 0.585);
  mesh(thermos, new THREE.SphereGeometry(0.112, 24, 12), silver, 0, 0.67).scale.y = 0.5;
  cylinder(thermos, 0.172, 0.035, champagne, -0.385);

  const keyboard = variant(3, 'TECH-KB-002', 'Bàn phím cơ không dây 3 Modes');
  rounded(keyboard, 0.96, 0.48, 0.09, silver, 0, 0);
  const keyGeometry = new RoundedBoxGeometry(0.073, 0.073, 0.035, 1, 0.008);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 10; col++) {
    if (row === 3 && col > 2 && col < 7) continue;
    mesh(keyboard, keyGeometry, col === 0 || col === 9 ? champagne : ivory, (col - 4.5) * 0.086, 0.145 - row * 0.09, 0.057);
  }
  rounded(keyboard, 0.33, 0.073, 0.035, champagne, -0.005, -0.125, 0.057);

  const tea = variant(3, 'GB-TEA-CHAMOMILE', 'Trà thảo mộc hoa cúc GreenBio');
  rounded(tea, 0.48, 0.62, 0.26, kraft, 0, 0);
  productLabel(tea, 'HOA CUC', 'GREENBIO', 0.4, 0.28, 0.06, 0.135);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    mesh(tea, new THREE.SphereGeometry(0.029, 12, 8), ivory, Math.cos(a) * 0.045, -0.18 + Math.sin(a) * 0.045, 0.14);
  }
  mesh(tea, new THREE.SphereGeometry(0.023, 12, 8), champagne, 0, -0.18, 0.16);

  const cleanser = variant(4, 'SS-CLEAN-150', 'Sữa rửa mặt Amino Acid Sora Skin');
  cylinder(cleanser, 0.16, 0.57, ivory, -0.03);
  cylinder(cleanser, 0.105, 0.12, champagne, 0.315);
  rounded(cleanser, 0.22, 0.055, 0.13, ivory, 0.045, 0.405);
  productLabel(cleanser, 'AMINO', 'SORA SKIN', 0.25, 0.24, -0.03, 0.163);

  const granola = variant(4, 'GB-GRANOLA-500', 'Granola siêu hạt mật ong 500g');
  rounded(granola, 0.48, 0.62, 0.19, kraft, 0, 0);
  rounded(granola, 0.46, 0.028, 0.2, champagne, 0, 0.29);
  productLabel(granola, 'GRANOLA', 'GREENBIO', 0.4, 0.21, 0.1, 0.102);
  for (let i = 0; i < 12; i++) {
    const seed = mesh(granola, new THREE.SphereGeometry(0.025, 10, 6), i % 3 ? oat : ivory, (i % 4 - 1.5) * 0.074, -0.09 - Math.floor(i / 4) * 0.055, 0.105);
    seed.scale.set(1.2, 0.65, 0.35); seed.rotation.z = i * 0.8;
  }
  const cleansingOil = variant(4, 'AB-CLEAN-OIL', 'Dầu tẩy trang Aura Bio');
  cylinder(cleansingOil, 0.17, 0.6, honey, -0.06);
  cylinder(cleansingOil, 0.11, 0.11, ivory, 0.31);
  rounded(cleansingOil, 0.25, 0.055, 0.12, ivory, 0.055, 0.4);
  productLabel(cleansingOil, 'AURA BIO', 'CLEANSING OIL', 0.28, 0.27, -0.04, 0.173);

  function selectAssortment(cycle: number, turn: number) {
    variants.forEach((choices, index) => {
      // Bags change every visit; the three gift slots retain their selection
      // through the finale and manual interaction, then change next cycle.
      const selected = index < 3 ? (cycle + 1) % choices.length
        : (cycle * 3 + Math.min(2, Math.floor(turn / 3)) + 1) % choices.length;
      choices.forEach((choice, i) => { choice.visible = i === selected; });
    });
  }
  // Individual flight paths stay close to the gift, below the headline.
  const destinations = [new THREE.Vector3(-0.7, 1.55, 0.48), new THREE.Vector3(0.6, 1.5, 0.64), new THREE.Vector3(-0.02, 1.73, 0.4), new THREE.Vector3(0.12, 1.66, 0), new THREE.Vector3(-0.05, 1.02, 0)];
  const start = new THREE.Vector3(0, -0.26, 0.02);
  const mouth = new THREE.Vector3(0, 0.68, 0.18);
  const bagMouth = new THREE.Vector3(0.12, 1.12, 0);
  const smallMouth = new THREE.Vector3(-0.05, 0.55, 0);
  const finaleExits = [new THREE.Vector3(-0.4, 0.68, 0.23), new THREE.Vector3(0.4, 0.68, 0.23), new THREE.Vector3(0, 0.68, -0.27)];
  const ease = (x: number) => { const t = THREE.MathUtils.clamp(x, 0, 1); return t * t * (3 - 2 * t); };
  let manual = false;
  let opened = true;
  let lidOpening = 1;
  const raised = [false, false, false];
  const bagsOpened = [false, false];
  let manualTime = 0;
  const dock = [new THREE.Vector3(-0.4, 0.47, 0.22), new THREE.Vector3(0.4, 0.49, 0.22), new THREE.Vector3(0, 0.44, -0.24)];
  const targetPosition = new THREE.Vector3();
  const outerPoint = new THREE.Vector3();
  function outerOrbit(angle: number) {
    if (orbitPoint) {
      orbitPoint(angle, outerPoint);
      parent.updateWorldMatrix(true, false);
      parent.worldToLocal(outerPoint);
    } else {
      outerPoint.set(Math.cos(angle) * 2.8 - 1.65, Math.sin(angle) * 1.7 + 0.6, 1.2);
    }
    return outerPoint;
  }
  function beginManual(openGift = true) {
    if (manual) return;
    manual = true;
    opened = openGift;
    models.slice(0, 3).forEach((model, i) => {
      if (!model.visible) { model.position.copy(dock[i]); model.scale.setScalar(0.5); }
      model.visible = true;
    });
    [perfume, lipstick].forEach((model, bagIndex) => {
      model.userData.viewportFlight = false;
      model.visible = true;
      model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.scale.setScalar(1);
      variants[bagIndex + 3].forEach((choice, index) => {
        choice.visible = false;
        choice.position.set((index % 2 - 0.5) * 0.25, -0.18, 0);
        choice.scale.setScalar(0.16);
      });
    });
  }
  function toggleBag(index: number) {
    if (index !== 0 && index !== 1) return;
    beginManual(false);
    bagsOpened[index] = !bagsOpened[index];
  }
  function toggleGift() {
    if (!manual) { beginManual(); opened = true; }
    else opened = !opened;
    if (!opened) raised.fill(false);
  }
  function toggleProduct(index: number) {
    if (index < 0 || index > 2) return;
    const wasFlying = !manual && models[index].visible && models[index].position.y > 1;
    beginManual(); opened = true;
    raised[index] = wasFlying ? false : !raised[index];
  }
  function updateManual(dt: number) {
    manualTime += Math.min(dt, 0.05);
    const blend = 1 - Math.exp(-dt * 7.5);
    [perfume, lipstick].forEach((model, bagIndex) => {
      const isOpen = bagsOpened[bagIndex];
      const large = bagIndex === 0;
      variants[bagIndex + 3].forEach((choice, index) => {
        const backRow = index >= 2;
        const x = (index % 2 - 0.5) * (large ? 0.95 : 0.59);
        const y = (large ? 1.38 : 0.78) + (backRow ? 0.37 : 0);
        targetPosition.set(isOpen ? x : x * 0.2,
          isOpen ? y + Math.sin(manualTime * 1.5 + index * 1.4) * 0.025 : -0.18,
          isOpen ? (backRow ? -0.12 : 0.35) : 0);
        choice.position.lerp(targetPosition, blend);
        const scale = isOpen ? (large ? 0.56 : 0.43) : 0.16;
        choice.scale.setScalar(choice.scale.x + (scale - choice.scale.x) * blend);
        choice.rotation.y += (0.25 - choice.rotation.y) * blend;
        choice.rotation.z += (((index % 2 ? -1 : 1) * (isOpen ? 0.07 : 0)) - choice.rotation.z) * blend;
        choice.visible = isOpen || choice.position.y > -0.16;
      });
      model.visible = variants[bagIndex + 3].some(choice => choice.visible);
    });
    let settled = true;
    models.slice(0, 3).forEach((model, i) => {
      targetPosition.copy(raised[i] ? destinations[i] : dock[i]);
      if (!opened) targetPosition.y = -0.19;
      model.position.lerp(targetPosition, blend);
      const targetScale = raised[i] ? (i === 2 ? 0.92 : 1) : 0.5;
      model.scale.setScalar(model.scale.x + (targetScale - model.scale.x) * blend);
      model.rotation.x += (0.04 - model.rotation.x) * blend;
      model.rotation.y += (0.32 - model.rotation.y) * blend;
      model.rotation.z += ((raised[i] ? [-0.17, 0.16, -0.06][i] : 0) - model.rotation.z) * blend;
      model.visible = opened || lidOpening > 0.03;
      if (model.position.distanceTo(targetPosition) > 0.05) settled = false;
    });
    // Return every item inside before the lid closes.
    const targetLid = opened || !settled ? 1 : 0;
    lidOpening += (targetLid - lidOpening) * blend;
    return lidOpening;
  }

  function update(time: number, dt = 1 / 60) {
    if (manual) return updateManual(dt);
    // Three individual gift turns alternate with the bags, followed by a shared finale.
    // Reduced-motion users see a still frame of the first product's flight.
    const { turn, slot, duration, cycle } = shoppingProductTurn(time);
    selectAssortment(cycle, turn);
    const finale = turn === 9;
    const activeIndex = turn % 3 === 0 ? Math.floor(turn / 3) : turn % 3 === 1 ? 3 : 4;
    const opening = ease(slot / 0.65) * (1 - ease((slot - (duration - 1)) / 0.8));
    models.forEach((model, index) => {
      model.userData.viewportFlight = false;
      const age = slot - 0.65;
      const returnAt = duration - 3.15;
      model.visible = (finale ? index < 3 : index === activeIndex) && age >= 0 && slot < (index >= 3 ? duration - 0.6 : returnAt + 2);
      if (!model.visible) return;
      const target = destinations[index];
      const exit = finale ? finaleExits[index] : index === 3 ? bagMouth : index === 4 ? smallMouth : mouth;
      if (index >= 3 && bagFlight) {
        const departureAt = 1.5;
        const arrivalAt = departureAt + BAG_FLIGHT_DURATION;
        const dockAt = arrivalAt + 0.75;
        let lift = 1;
        let floatTurn = 0;
        let bank = -0.1 * ease(age / departureAt);
        if (age < 0.8) {
          lift = ease(age / 0.8);
          model.position.lerpVectors(start, exit, lift);
        } else if (age < departureAt) {
          model.position.lerpVectors(exit, target, ease((age - 0.8) / (departureAt - 0.8)));
        } else if (age < arrivalAt) {
          const progress = (age - departureAt) / (arrivalAt - departureAt);
          model.userData.viewportFlight = true;
          bagFlight(model, target, progress);
          // A restrained turn catches the light while keeping the front readable.
          floatTurn = Math.sin(progress * Math.PI * 2) * 0.1;
          // Keep the rightward lean throughout ascent; bank left on the return.
          bank = progress < 0.52
            ? -0.1 - 0.035 * Math.sin(progress / 0.52 * Math.PI)
            : 0.12 * Math.sin(ease((progress - 0.52) / 0.48) * Math.PI);
        } else if (age < dockAt) {
          bank = 0;
          model.position.lerpVectors(target, exit, ease((age - arrivalAt) / (dockAt - arrivalAt)));
        } else {
          bank = 0;
          lift = 1 - ease((age - dockAt) / 0.65);
          model.position.lerpVectors(start, exit, lift);
        }
        model.scale.setScalar(0.26 + lift * 0.74);
        model.rotation.set(0.04 + floatTurn * 0.35, 0.32 + floatTurn, bank);
        return;
      }
      if (index < 3 && !finale) {
        // Leave the mouth, loop around the entire illustration, then return.
        let lift = 1;
        let angle = 0;
        let orbitBlend = 0;
        if (age < 0.55) {
          lift = ease(age / 0.55);
          model.position.lerpVectors(start, mouth, lift);
        } else if (age < 1.1) {
          orbitBlend = ease((age - 0.55) / 0.55);
          model.position.lerpVectors(mouth, outerOrbit(0), orbitBlend);
        } else if (age < 4.9) {
          orbitBlend = 1;
          angle = ease((age - 1.1) / 3.8) * Math.PI * 2;
          model.position.copy(outerOrbit(angle));
        } else if (age < 5.45) {
          orbitBlend = 1 - ease((age - 4.9) / 0.55);
          model.position.lerpVectors(mouth, outerOrbit(0), orbitBlend);
        } else {
          lift = 1 - ease((age - 5.45) / 0.7);
          model.position.lerpVectors(start, mouth, lift);
        }
        const bank = Math.sin(angle);
        model.scale.setScalar((index === 2 ? 0.92 : 1) * (0.26 + lift * 0.74) * (1 - orbitBlend * 0.42));
        model.rotation.set(bank * 0.08, 0.32 + bank * 0.28, -bank * 0.18);
        return;
      }
      let lift = 1;
      let spread = 0;
      if (age < 0.65) {
        lift = ease(age / 0.65);
        model.position.lerpVectors(start, exit, lift);
      } else if (age < 2.15) {
        const progress = (age - 0.65) / 1.5;
        spread = ease(progress);
        model.position.lerpVectors(exit, target, spread);
        // A soft vertical arc gives the ascent inertia without a sharp bounce.
        model.position.y += Math.sin(progress * Math.PI) * 0.18;
      } else if (slot < returnAt) {
        spread = 1;
        model.position.copy(target);
        const hold = age - 2.15;
        const envelope = ease(hold / 0.45) * ease((returnAt - slot) / 0.45);
        model.position.y += Math.sin(hold * 2 + index) * 0.07 * envelope;
        model.position.x += Math.sin(hold * 1.5 + index) * 0.035 * envelope;
      } else if (slot < returnAt + 1.3) {
        spread = 1 - ease((slot - returnAt) / 1.3);
        model.position.lerpVectors(exit, target, spread);
      } else {
        lift = 1 - ease((slot - returnAt - 1.3) / 0.7);
        model.position.lerpVectors(start, exit, lift);
      }
      const scale = (index === 2 ? 0.92 : 1) * (0.26 + lift * 0.74) * (finale ? 0.75 + spread * 0.25 : 1);
      model.scale.setScalar(scale);
      model.rotation.set(spread * 0.08, 0.32 + Math.sin(age * 1.25) * 0.22 * spread, spread * [-0.17, 0.16, -0.06, -0.08, 0.12][index]);
    });
    lidOpening = finale || activeIndex < 3 ? opening : 0;
    return lidOpening;
  }
  update(0);
  return { update, textures, toggleGift, toggleProduct, toggleBag, viewportProducts: [perfume, lipstick], isManual: () => manual,
    bagIndex(object: THREE.Object3D) {
      let current: THREE.Object3D | null = object;
      while (current) {
        if (current === bag) return 0;
        if (current === smallBag) return 1;
        current = current.parent;
      }
      return -1;
    },
    productIndex(object: THREE.Object3D) {
      let current: THREE.Object3D | null = object;
      while (current && current !== parent) {
        const index = models.indexOf(current as THREE.Group);
        if (index >= 0 && index < 3) return index;
        current = current.parent;
      }
      return -1;
    },
  };
}
