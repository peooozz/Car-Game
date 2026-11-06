/**
 * src/assets/normalizeModel.js
 * Implements normalizeModel(gltf, options):
 * 1. Compute bounding box; rescale (cars ~4.4 units long, scene scale per manifest).
 * 2. For cars: recenter pivot to x/z center, y=0 on ground.
 *    For environment scene: preserve world alignment and Y=0 road elevation.
 * 3. Verify forward direction (+Z); hide static motion-blur placeholder planes.
 * 4. Find wheels by node name or manifest wheelNodeNames, reparent to steer/spin pivots.
 * 5. Set castShadow/receiveShadow, sRGB color space, and duplicate material handling.
 */
import * as THREE from 'three';

const WHEEL_PATTERN = /^(?=.*(?:wheel|tire|tyre|rim|torus))(?!.*(?:mirror|suspension|caliper|disc|brake|arm|steering)).*$/i;
const FOLIAGE_PATTERN = /leaf|leaves|palm|frond|canopy|foliage|fern|bush|grass|thatch/i;
const HIDE_PATTERN = /blur|cicada_shadow|ground_shadow|plane_shadow/i;

function computeVisibleBox(obj) {
  const box = new THREE.Box3();
  obj.updateMatrixWorld(true);
  let hasMesh = false;
  obj.traverse((child) => {
    if (child.isMesh && child.visible) {
      if (child.geometry) {
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        const mBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
        box.union(mBox);
        hasMesh = true;
      }
    }
  });
  if (!hasMesh) {
    box.setFromObject(obj);
  }
  return box;
}

export function normalizeModel(rawScene, options = {}) {
  const {
    targetLength = 4.4,
    manifestScale = null,
    manifestRotationY = null,
    wheelNodeNames = [],
    tintColor = null,
    isCar = true
  } = options;

  const root = new THREE.Group();
  root.name = isCar ? 'NormalizedCarRoot' : 'NormalizedEnvRoot';

  const cloned = rawScene.clone(true);
  const materialCache = new Map();

  // Configure materials, shadows, sRGB, foliage, and hide static motion blur & baked shadow planes
  cloned.traverse((node) => {
    // Hide static blur and baked shadow planes (common in Sketchfab models)
    if (HIDE_PATTERN.test(node.name) || (node.material && HIDE_PATTERN.test(node.material.name || ''))) {
      node.visible = false;
    }

    if (node.isMesh) {
      // Disable expensive shadow map passes on sub-meshes
      node.castShadow = false;
      node.receiveShadow = false;

      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        const processed = mats.map((mat) => {
          if (HIDE_PATTERN.test(mat.name || '')) {
            node.visible = false;
          }

          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
          }

          // Only clone if tint is explicitly needed
          if (tintColor && isCar && /body|chassis|hull|paint|wccarbody/i.test(`${node.name}_${mat.name}`)) {
            const m = mat.clone();
            m.color = new THREE.Color(tintColor);
            return m;
          }
          return mat;
        });
        node.material = Array.isArray(node.material) ? processed : processed[0];
      }
    }
  });

  // Compute initial bounding box from visible meshes
  cloned.updateMatrixWorld(true);
  const initialBox = computeVisibleBox(cloned);
  const initialSize = new THREE.Vector3();
  initialBox.getSize(initialSize);

  const isLargeScene = !isCar && (initialSize.x > 60 || initialSize.z > 60);

  // Auto-rotate if needed or apply manifestRotationY
  let autoRotY = 0;
  if (manifestRotationY !== null && manifestRotationY !== undefined) {
    autoRotY = manifestRotationY;
  } else if (isCar && initialSize.x > initialSize.z * 1.15) {
    autoRotY = Math.PI / 2;
  }
  if (autoRotY !== 0) {
    cloned.rotation.y = autoRotY;
    cloned.updateMatrixWorld(true);
  }

  // Recompute bounding box after rotation
  const rotBox = computeVisibleBox(cloned);
  const rotSize = new THREE.Vector3();
  rotBox.getSize(rotSize);

  const maxHoriz = Math.max(rotSize.x, rotSize.z, 0.001);
  const scale = manifestScale && manifestScale > 0
    ? manifestScale
    : isLargeScene
      ? 1.0
      : targetLength / maxHoriz;

  cloned.scale.setScalar(scale);
  cloned.updateMatrixWorld(true);

  if (isCar) {
    // Recenter X/Z to 0 and place bottom of wheels at Y = 0
    const scaledBox = computeVisibleBox(cloned);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    cloned.position.x -= scaledCenter.x;
    cloned.position.z -= scaledCenter.z;
    cloned.position.y -= scaledBox.min.y;
    cloned.updateMatrixWorld(true);
  } else if (!isLargeScene) {
    // Props: place bottom at Y = 0
    const scaledBox = computeVisibleBox(cloned);
    cloned.position.y -= scaledBox.min.y;
    cloned.updateMatrixWorld(true);
  } else {
    // Large environment scene: preserve world alignment and Y=0 road level
    cloned.position.set(0, 0, 0);
    cloned.updateMatrixWorld(true);
  }

  root.add(cloned);
  root.updateMatrixWorld(true);

  // Discover wheel nodes and reparent each to its own steer/spin pivot
  const wheelPivots = [];
  if (isCar) {
    const candidateNodes = [];
    const nameSet = new Set((wheelNodeNames || []).map((n) => n.toLowerCase()));

    cloned.traverse((node) => {
      if (node === cloned) return;
      const lower = (node.name || '').toLowerCase();
      // Exclude steering wheel
      if (lower.includes('steering')) return;

      if (nameSet.has(lower) || (wheelNodeNames.length === 0 && WHEEL_PATTERN.test(lower))) {
        let ancestorAlreadyAdded = false;
        let p = node.parent;
        while (p && p !== cloned) {
          if (candidateNodes.includes(p)) {
            ancestorAlreadyAdded = true;
            break;
          }
          p = p.parent;
        }
        if (!ancestorAlreadyAdded) {
          candidateNodes.push(node);
        }
      }
    });

    const finalBox = computeVisibleBox(root);
    const carCenter = new THREE.Vector3();
    finalBox.getCenter(carCenter);

    candidateNodes.forEach((wheelNode) => {
      const wBox = computeVisibleBox(wheelNode);
      const wCenterWorld = new THREE.Vector3();
      wBox.getCenter(wCenterWorld);

      const parent = wheelNode.parent;
      if (!parent) return;

      const steerPivot = new THREE.Group();
      steerPivot.name = `steerPivot_${wheelNode.name}`;
      const spinPivot = new THREE.Group();
      spinPivot.name = `spinPivot_${wheelNode.name}`;

      const localCenter = parent.worldToLocal(wCenterWorld.clone());
      steerPivot.position.copy(localCenter);
      parent.add(steerPivot);
      steerPivot.add(spinPivot);

      spinPivot.attach(wheelNode);

      const isFront = wCenterWorld.z >= carCenter.z;
      const isLeft = wCenterWorld.x < carCenter.x;

      wheelPivots.push({
        name: wheelNode.name,
        steerPivot,
        spinPivot,
        isFront,
        isLeft,
        worldCenter: wCenterWorld.clone()
      });
    });
  }

  const normalizedBox = computeVisibleBox(root);
  const normalizedSize = new THREE.Vector3();
  normalizedBox.getSize(normalizedSize);

  return {
    root,
    wheelPivots,
    bbox: normalizedBox,
    size: normalizedSize
  };
}

/**
 * Procedural fallback buggy when a GLB file is missing or corrupted.
 */
export function createProceduralBuggy(color = '#e10600', accentColor = '#ffd000') {
  const root = new THREE.Group();
  root.name = 'ProceduralBuggyRoot';

  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3, metalness: 0.1 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#1f242d', roughness: 0.8 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.25, metalness: 0.6 });

  // Aerodynamic body chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 3.8), bodyMat);
  chassis.position.set(0, 0.5, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  root.add(chassis);

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 8), accentMat);
  nose.position.set(0, 0.5, 2.2);
  nose.rotation.x = Math.PI / 2;
  nose.castShadow = true;
  root.add(nose);

  // Front Wing
  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.45), accentMat);
  frontWing.position.set(0, 0.25, 2.35);
  frontWing.castShadow = true;
  root.add(frontWing);

  // Rear Wing
  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 0.5), accentMat);
  rearWing.position.set(0, 1.25, -1.7);
  rearWing.castShadow = true;
  root.add(rearWing);

  // Driver Helmet
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }));
  helmet.position.set(0, 0.95, -0.1);
  helmet.castShadow = true;
  root.add(helmet);

  // 4 Wheels
  const wheelSpecs = [
    { name: 'wheel_fl', x: -0.98, y: 0.38, z: 1.35, r: 0.38, w: 0.32, isFront: true, isLeft: true },
    { name: 'wheel_fr', x:  0.98, y: 0.38, z: 1.35, r: 0.38, w: 0.32, isFront: true, isLeft: false },
    { name: 'wheel_rl', x: -1.02, y: 0.42, z: -1.35, r: 0.42, w: 0.38, isFront: false, isLeft: true },
    { name: 'wheel_rr', x:  1.02, y: 0.42, z: -1.35, r: 0.42, w: 0.38, isFront: false, isLeft: false }
  ];

  const wheelPivots = [];
  wheelSpecs.forEach((ws) => {
    const steerPivot = new THREE.Group();
    steerPivot.position.set(ws.x, ws.y, ws.z);
    const spinPivot = new THREE.Group();
    steerPivot.add(spinPivot);

    const tireGeo = new THREE.CylinderGeometry(ws.r, ws.r, ws.w, 14);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, darkMat);
    tireMesh.castShadow = true;
    spinPivot.add(tireMesh);

    const hubGeo = new THREE.CylinderGeometry(ws.r * 0.55, ws.r * 0.55, ws.w + 0.02, 10);
    hubGeo.rotateZ(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, rimMat);
    spinPivot.add(hubMesh);

    root.add(steerPivot);
    wheelPivots.push({
      name: ws.name,
      steerPivot,
      spinPivot,
      isFront: ws.isFront,
      isLeft: ws.isLeft,
      worldCenter: new THREE.Vector3(ws.x, ws.y, ws.z)
    });
  });

  const bbox = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  return { root, wheelPivots, bbox, size };
}

/**
 * Procedural fallback environment prop.
 */
export function createProceduralProp(type = 'palm_tree_tropical') {
  const group = new THREE.Group();
  if (/umbrella/i.test(type)) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.4 })
    );
    pole.position.y = 1.25;
    pole.castShadow = true;
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 0.75, 10),
      new THREE.MeshStandardMaterial({ color: '#ff3b5c', roughness: 0.6 })
    );
    top.position.y = 2.55;
    top.castShadow = true;
    group.add(pole, top);
  } else if (/rock|boulder/i.test(type)) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.2, 0),
      new THREE.MeshStandardMaterial({ color: '#7c7772', roughness: 0.9 })
    );
    rock.position.y = 0.75;
    rock.scale.set(1.2, 0.85, 1.0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  } else if (/hut|totem/i.test(type)) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.5, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: '#9c6b3b', roughness: 0.85 })
    );
    base.position.y = 1.2;
    base.castShadow = true;
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.1, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: '#d9a738', roughness: 0.75 })
    );
    roof.position.y = 3.0;
    roof.castShadow = true;
    group.add(base, roof);
  } else {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.32, 4.2, 8),
      new THREE.MeshStandardMaterial({ color: '#8c5828', roughness: 0.85 })
    );
    trunk.position.y = 2.1;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(1.85, 1.4, 7),
      new THREE.MeshStandardMaterial({ color: '#28b846', roughness: 0.65 })
    );
    crown.position.y = 4.35;
    crown.castShadow = true;
    group.add(trunk, crown);
  }
  return group;
}
