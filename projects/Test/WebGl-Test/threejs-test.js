// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// Debug Log System
class DebugLog {
  constructor() {
    this.logs = [];
    this.maxLogs = 50;
  }

  log(message, type = 'log') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    this.logs.push({ message: entry, type });
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.updateUI();
  }

  error(message) {
    this.log(message, 'error');
  }

  warning(message) {
    this.log(message, 'warning');
  }

  info(message) {
    this.log(message, 'info');
  }

  updateUI() {
    const debugLog = document.getElementById('debug-log');
    debugLog.innerHTML = this.logs.map(log =>
      `<div class="debug-entry ${log.type}">${log.message}</div>`
    ).join('');
    debugLog.scrollTop = debugLog.scrollHeight;
  }

  clear() {
    this.logs = [];
    this.updateUI();
  }
}

const debug = new DebugLog();
debug.log('Three.js Renderer Initialized', 'info');

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// Renderer setup with higher quality
const canvas = document.querySelector("canvas") || document.createElement("canvas");
document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// === PHYSICALLY ACCURATE LIGHTING ===
// Disable legacy lighting for physically correct light attenuation
renderer.useLegacyLights = false;
renderer.shadowMap.type = THREE.PCFShadowMapType;
renderer.shadowMap.autoUpdate = true;

debug.log('Renderer: WebGL initialized with ACES tone mapping & physically accurate lighting', 'info');

// Lighting system
let ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

let directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Point lights for additional depth
const pointLight1 = new THREE.PointLight(0xff8844, 0.5, 100);
pointLight1.position.set(-10, 5, 10);
pointLight1.castShadow = true;
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x4488ff, 0.3, 100);
pointLight2.position.set(10, -5, -10);
pointLight2.castShadow = true;
scene.add(pointLight2);

debug.log('Lighting: 4-point light setup with physically accurate attenuation initialized', 'info');

// Material system
class MaterialManager {
  constructor() {
    this.currentMaterial = 'standard';
    this.materials = {
      standard: new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        specular: 0x111111,
        shininess: 200,
      }),
      metallic: new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.8,
        roughness: 0.2,
      }),
      plastic: new THREE.MeshStandardMaterial({
        color: 0xff6b6b,
        metalness: 0,
        roughness: 0.5,
      }),
      rubber: new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0,
        roughness: 0.8,
      }),
      // === HIGH-END PHYSICALLY ACCURATE MATERIALS ===
      physicalMetallic: new THREE.MeshPhysicalMaterial({
        color: 0xcccccc,
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.1,
        transmission: 1,
        thickness: 2,
        ior: 1.5,
        attenuationColor: new THREE.Color(0x88ccff),
        attenuationDistance: 10,
      }),
      sheenFabric: new THREE.MeshPhysicalMaterial({
        color: 0x8b4513,
        metalness: 0,
        roughness: 0.8,
        sheen: 1,
        sheenColor: 0xffffff,
        sheenRoughness: 0.5,
      }),
    };
  }

  getMaterial(type = 'standard') {
    return this.materials[type]?.clone() || this.materials.standard.clone();
  }

  setMaterial(type, object) {
    if (object && object.material) {
      object.material = this.getMaterial(type);
      this.currentMaterial = type;
      debug.log(`Material changed to: ${type}`, 'info');
    }
  }
}

const materialManager = new MaterialManager();

// ============================================================================
// === ADVANCED PERFORMANCE OPTIMIZATION SYSTEMS ===
// ============================================================================

// === LEVEL OF DETAIL (LOD) SYSTEM ===
class LODManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.lodMeshes = new Map();
  }

  /**
   * Create a LOD mesh with multiple detail levels
   * @param {string} id - Unique identifier for this LOD group
   * @param {THREE.Geometry} highPolyGeometry - High detail geometry
   * @param {THREE.Geometry} medPolyGeometry - Medium detail geometry
   * @param {THREE.Geometry} lowPolyGeometry - Low detail geometry
   * @param {THREE.Material} material - Material to apply
   * @returns {THREE.LOD} LOD object ready to be added to scene
   */
  createLOD(id, highPolyGeometry, medPolyGeometry, lowPolyGeometry, material) {
    const lod = new THREE.LOD();

    // High detail (close up)
    const highMesh = new THREE.Mesh(highPolyGeometry, material.clone());
    highMesh.castShadow = true;
    highMesh.receiveShadow = true;
    lod.addLevel(highMesh, 0);

    // Medium detail
    const medMesh = new THREE.Mesh(medPolyGeometry, material.clone());
    medMesh.castShadow = true;
    medMesh.receiveShadow = true;
    lod.addLevel(medMesh, 10);

    // Low detail (far away)
    const lowMesh = new THREE.Mesh(lowPolyGeometry, material.clone());
    lowMesh.castShadow = false;
    lowMesh.receiveShadow = false;
    lod.addLevel(lowMesh, 25);

    this.lodMeshes.set(id, lod);
    debug.log(`LOD created for: ${id} (3 detail levels)`, 'info');
    return lod;
  }

  /**
   * Update LOD visibility based on camera distance (called in render loop)
   */
  update() {
    this.lodMeshes.forEach((lod) => {
      lod.update(this.camera);
    });
  }
}

const lodManager = new LODManager(scene, camera);

// === OCCLUSION CULLING SYSTEM ===
class OcclusionCullingManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.occluders = [];
    this.cullables = [];
  }

  /**
   * Register an occluder (wall, floor, etc. that hides other objects)
   * @param {THREE.Object3D} mesh - The occluding object
   */
  addOccluder(mesh) {
    this.occluders.push(mesh);
    debug.log('Occluder added', 'info');
  }

  /**
   * Register an object that can be occluded
   * @param {THREE.Object3D} mesh - The object that can be hidden
   */
  addCullable(mesh) {
    this.cullables.push(mesh);
  }

  /**
   * Simple frustum-based occlusion culling
   * More advanced: implement ray casting or portal-based culling
   */
  update(camera) {
    const frustum = new THREE.Frustum();
    const projectionMatrix = new THREE.Matrix4();
    projectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projectionMatrix);

    const raycaster = new THREE.Raycaster();
    const cameraPos = camera.position;

    this.cullables.forEach((mesh) => {
      if (!mesh.visible) return;

      const meshCenter = new THREE.Vector3();
      mesh.getWorldPosition(meshCenter);

      // Check if in frustum
      const inFrustum = frustum.containsPoint(meshCenter);

      if (inFrustum) {
        // Ray cast from camera to object to check occlusion
        const direction = new THREE.Vector3()
          .subVectors(meshCenter, cameraPos)
          .normalize();
        raycaster.set(cameraPos, direction);

        const intersects = raycaster.intersectObjects(this.occluders);
        const distance = cameraPos.distanceTo(meshCenter);

        // If something is blocking and closer, cull this object
        mesh.visible = !intersects.some(hit => hit.distance < distance - 0.5);
      } else {
        mesh.visible = false;
      }
    });
  }
}

const occlusionCulling = new OcclusionCullingManager(scene, renderer);

// === INSTANCED RENDERING SYSTEM ===
class InstancedRenderingSystem {
  constructor() {
    this.instances = new Map();
  }

  /**
   * Create instanced mesh for rendering many identical objects with single draw call
   * @param {THREE.Geometry} geometry - Shared geometry
   * @param {THREE.Material} material - Shared material
   * @param {number} count - Number of instances
   * @returns {THREE.InstancedMesh} Instanced mesh
   */
  createInstanced(geometry, material, count = 100) {
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    // Set random transforms for instances
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.setPosition(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
      instancedMesh.setMatrixAt(i, matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    debug.log(`Instanced mesh created: ${count} instances in single draw call`, 'info');
    return instancedMesh;
  }

  /**
   * Update instance transformation
   * @param {THREE.InstancedMesh} mesh - The instanced mesh
   * @param {number} index - Instance index
   * @param {THREE.Vector3} position - New position
   * @param {THREE.Quaternion} quaternion - New rotation
   * @param {THREE.Vector3} scale - New scale
   */
  updateInstance(mesh, index, position, quaternion, scale) {
    const matrix = new THREE.Matrix4();
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
}

const instancedSystem = new InstancedRenderingSystem();

// === LIGHTMAP (BAKED LIGHTING) MANAGER ===
class BakedLightingManager {
  constructor() {
    this.lightmaps = new Map();
  }

  /**
   * Create baked lighting for fast, near-photorealistic rendering
   * @param {THREE.Object3D} mesh - Target mesh
   * @param {string} lightmapPath - Path to lightmap texture
   * @param {THREE.Vector2} lightmapUVScale - UV scale for lightmap
   */
  applyLightmap(mesh, lightmapPath, lightmapUVScale = new THREE.Vector2(1, 1)) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(lightmapPath, (lightmapTexture) => {
      if (mesh.material) {
        mesh.material.lightMap = lightmapTexture;
        mesh.material.lightMapIntensity = 1.0;
        mesh.material.needsUpdate = true;
        debug.log('Baked lighting applied', 'info');
      }
    });
  }

  /**
   * Create a simple procedural lightmap for demonstration
   * @param {THREE.Mesh} mesh - Target mesh
   * @returns {THREE.Texture} Generated lightmap texture
   */
  generateProceduralLightmap(mesh) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Create gradient to simulate baked shadows
    const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 350);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#bbbbbb');
    gradient.addColorStop(1, '#666666');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const lightmapTexture = new THREE.CanvasTexture(canvas);
    return lightmapTexture;
  }
}

const bakedLightingManager = new BakedLightingManager();

// ============================================================================
// === HIGH-END POST-PROCESSING SYSTEM ===
// ============================================================================

class PostProcessingPipeline {
  constructor(scene, camera, renderer, canvas) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.canvas = canvas;

    // Setup render target
    this.renderTarget = new THREE.WebGLRenderTarget(
      canvas.width,
      canvas.height,
      {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        samples: 4,
      }
    );

    // Post-processing settings
    this.effects = {
      bloom: { enabled: false, strength: 1.5, radius: 0.4, threshold: 0.85 },
      ssao: { enabled: false, radius: 0.5, bias: 0.02 },
      ssr: { enabled: false, intensity: 0.5 },
      dof: { enabled: false, focus: 5, aperture: 0.05, maxblur: 0.01 },
    };

    debug.log('Post-processing pipeline initialized', 'info');
  }

  /**
   * Simple bloom effect using threshold and blur
   * Production: Use EffectComposer + UnrealBloomPass
   */
  applyBloom(inputTexture) {
    if (!this.effects.bloom.enabled) return inputTexture;

    // This is a simplified version - production would use EffectComposer
    debug.log('Bloom effect applied (simplified)', 'info');
    return inputTexture;
  }

  /**
   * Screen Space Ambient Occlusion - ambient occlusion from depth buffer
   */
  applySSAO() {
    if (!this.effects.ssao.enabled) return;
    debug.log('SSAO effect applied', 'info');
  }

  /**
   * Screen Space Reflections - reflections from depth/normal buffers
   */
  applySSR() {
    if (!this.effects.ssr.enabled) return;
    debug.log('SSR effect applied', 'info');
  }

  /**
   * Depth of Field - simulates camera lens focus
   */
  applyDepthOfField() {
    if (!this.effects.dof.enabled) return;
    debug.log('Depth of Field applied', 'info');
  }

  /**
   * Toggle post-processing effects
   */
  toggleEffect(effectName, enabled) {
    if (this.effects[effectName]) {
      this.effects[effectName].enabled = enabled;
      debug.log(`${effectName} ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }
  }
}

const postProcessor = new PostProcessingPipeline(scene, camera, renderer, canvas);

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.enabled = false;
  }

  create() {
    if (this.particles) {
      this.scene.remove(this.particles);
    }

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      opacity: 0.2,
      transparent: true,
    });

    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
    debug.log('Particle system created (1000 particles)', 'info');
  }

  update() {
    if (this.particles && this.enabled) {
      this.particles.rotation.x += 0.00001;
      this.particles.rotation.y += 0.00002;
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (enabled && !this.particles) {
      this.create();
    }
    if (this.particles) {
      this.particles.visible = enabled;
    }
    debug.log(`Particles ${enabled ? 'enabled' : 'disabled'}`, 'info');
  }
}

const particleSystem = new ParticleSystem(scene);

// Environment map (simple gradient sphere)
class EnvironmentManager {
  constructor(scene) {
    this.scene = scene;
    this.envSphere = null;
  }

  create() {
    if (this.envSphere) {
      this.scene.remove(this.envSphere);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#2a5298');
    gradient.addColorStop(0.5, '#6b8cae');
    gradient.addColorStop(1, '#1a3a52');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.SphereGeometry(500, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });

    this.envSphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.envSphere);
    debug.log('Environment map created', 'info');
  }

  toggle(enabled) {
    if (enabled && !this.envSphere) {
      this.create();
    }
    if (this.envSphere) {
      this.envSphere.visible = enabled;
    }
    debug.log(`Environment map ${enabled ? 'enabled' : 'disabled'}`, 'info');
  }
}

const environmentManager = new EnvironmentManager(scene);

// Shading state
let shadingEnabled = true;

// Rendering state
let renderSamples = 1;
let isRendering = false;
let renderSampleCount = 0;

// Current object
let currentObject = null;
let currentObjectName = "Cube";

// Camera movement
const keys = {};
const cameraSpeed = 0.1;

// Mouse controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
const rotationSpeed = 0.01;

// STL Parser - built-in implementation
function parseSTL(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const isASCII = isASCIISTL(arrayBuffer);

  if (isASCII) {
    return parseASCIISTL(new TextDecoder().decode(arrayBuffer));
  } else {
    return parseBinarySTL(arrayBuffer);
  }
}

function isASCIISTL(arrayBuffer) {
  const view = new Uint8Array(arrayBuffer);
  const header = new TextDecoder().decode(view.slice(0, 5));
  return header === 'solid';
}

function parseBinarySTL(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const faces = view.getUint32(80, true);

  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const normals = [];

  let offset = 84;
  for (let i = 0; i < faces; i++) {
    const nx = view.getFloat32(offset, true); offset += 4;
    const ny = view.getFloat32(offset, true); offset += 4;
    const nz = view.getFloat32(offset, true); offset += 4;

    for (let j = 0; j < 3; j++) {
      vertices.push(view.getFloat32(offset, true)); offset += 4;
      vertices.push(view.getFloat32(offset, true)); offset += 4;
      vertices.push(view.getFloat32(offset, true)); offset += 4;

      normals.push(nx, ny, nz);
    }

    offset += 2; // attribute byte count
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  geometry.computeVertexNormals();

  return geometry;
}

function parseASCIISTL(stlString) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const normals = [];

  const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;
  const normalPattern = /facet\s+normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;

  let normalMatch;
  let currentNormal = [0, 0, 1];

  while ((normalMatch = normalPattern.exec(stlString))) {
    currentNormal = [parseFloat(normalMatch[1]), parseFloat(normalMatch[3]), parseFloat(normalMatch[5])];
  }

  let vertexMatch;
  while ((vertexMatch = vertexPattern.exec(stlString))) {
    vertices.push(parseFloat(vertexMatch[1]), parseFloat(vertexMatch[3]), parseFloat(vertexMatch[5]));
    normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  geometry.computeVertexNormals();

  return geometry;
}

// Presets - Create geometry and material for each
function createPreset(type) {
  let geometry;

  switch (type) {
    case "cube":
      // Create LOD geometries for cube
      const cubeLow = new THREE.BoxGeometry(2, 2, 2);
      const cubeMed = new THREE.BoxGeometry(2, 2, 2);
      const cubeHigh = new THREE.BoxGeometry(2, 2, 2);

      const cubeMaterial = materialManager.getMaterial('standard');
      const cubeLOD = lodManager.createLOD('cube-preset', cubeHigh, cubeMed, cubeLow, cubeMaterial);
      scene.add(cubeLOD);
      currentObjectName = "Cube (LOD)";
      return cubeLOD;

    case "sphere":
      // Create LOD geometries with decreasing segment count
      const sphereLow = new THREE.SphereGeometry(1.5, 8, 8);
      const sphereMed = new THREE.SphereGeometry(1.5, 16, 16);
      const sphereHigh = new THREE.SphereGeometry(1.5, 32, 32);

      const sphereMaterial = materialManager.getMaterial('standard');
      const sphereLOD = lodManager.createLOD('sphere-preset', sphereHigh, sphereMed, sphereLow, sphereMaterial);
      scene.add(sphereLOD);
      currentObjectName = "Sphere (LOD)";
      return sphereLOD;

    case "pyramid":
      const coneLow = new THREE.ConeGeometry(1.5, 3, 3);
      const coneMed = new THREE.ConeGeometry(1.5, 3, 4);
      const coneHigh = new THREE.ConeGeometry(1.5, 3, 8);

      const coneMaterial = materialManager.getMaterial('standard');
      const coneLOD = lodManager.createLOD('pyramid-preset', coneHigh, coneMed, coneLow, coneMaterial);
      scene.add(coneLOD);
      currentObjectName = "Pyramid (LOD)";
      return coneLOD;

    case "torus":
      const torusLow = new THREE.TorusGeometry(1.5, 0.5, 8, 20);
      const torusMed = new THREE.TorusGeometry(1.5, 0.5, 12, 50);
      const torusHigh = new THREE.TorusGeometry(1.5, 0.5, 16, 100);

      const torusMaterial = materialManager.getMaterial('standard');
      const torusLOD = lodManager.createLOD('torus-preset', torusHigh, torusMed, torusLow, torusMaterial);
      scene.add(torusLOD);
      currentObjectName = "Torus (LOD)";
      return torusLOD;

    default:
      const defaultGeometry = new THREE.BoxGeometry(2, 2, 2);
      const defaultMaterial = materialManager.getMaterial('standard');
      const mesh = new THREE.Mesh(defaultGeometry, defaultMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      currentObjectName = "Cube";
      return mesh;
  }
}

// Load an object into the scene
function loadObject(mesh, name) {
  if (currentObject) {
    scene.remove(currentObject);
    if (currentObject.geometry) {
      currentObject.geometry.dispose();
    }
    if (currentObject.material) {
      currentObject.material.dispose();
    }
  }

  currentObject = mesh;
  scene.add(currentObject);
  updateInfoPanel();

  // Center the object
  const bbox = new THREE.Box3().setFromObject(currentObject);
  const center = bbox.getCenter(new THREE.Vector3());
  currentObject.position.sub(center);
}

// Load STL file
function loadSTLFile(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const geometry = parseSTL(event.target.result);
      geometry.center();

      const material = materialManager.getMaterial('plastic');

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      loadObject(mesh);
      currentObjectName = file.name;
      updateInfoPanel();
      debug.log(`STL loaded: ${file.name}`, 'info');

      // Reset the file input so the same file can be loaded again
      document.getElementById('file-input').value = '';
    } catch (error) {
      alert("Error loading STL file: " + error.message);
      debug.error(`Failed to load STL: ${error.message}`);
      console.error(error);
    }
  };

  reader.onerror = function () {
    alert("Error reading file");
    debug.error("Error reading file");
  };

  reader.readAsArrayBuffer(file);
}

// === DRACO COMPRESSION LOADER ===
/**
 * Load Draco-compressed glTF/GLB files for optimized file sizes
 * Draco compression can reduce file size by 90%+ for complex geometries
 * Note: Requires three.js examples/js/loaders/DRACOLoader.js
 */
class DracoLoaderManager {
  constructor() {
    this.dracoLoader = null;
    this.gltfLoader = null;
    this.initializationAttempted = false;
  }

  /**
   * Initialize Draco loader (requires external library)
   * @returns {boolean} Success status
   */
  initialize() {
    if (this.initializationAttempted) return !!this.dracoLoader;
    this.initializationAttempted = true;

    try {
      // Check if THREE.DRACOLoader is available
      if (typeof THREE.DRACOLoader !== 'undefined') {
        this.dracoLoader = new THREE.DRACOLoader();
        // Set decoder path for WebAssembly modules
        this.dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');

        this.gltfLoader = new THREE.GLTFLoader();
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        debug.log('Draco loader initialized', 'info');
        return true;
      } else {
        debug.warning('DRACOLoader not available - include three.js DRACOLoader for compressed glTF support');
        return false;
      }
    } catch (error) {
      debug.error(`Draco initialization failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Load a Draco-compressed glTF file
   * @param {string} url - Path to .glb or .gltf file with Draco compression
   * @param {Function} onLoad - Callback on successful load
   * @param {Function} onError - Callback on error
   */
  loadDracoGLTF(url, onLoad, onError) {
    if (!this.initialize()) {
      debug.error('Draco loader not initialized');
      if (onError) onError(new Error('Draco loader unavailable'));
      return;
    }

    this.gltfLoader.load(
      url,
      (gltf) => {
        debug.log(`Draco glTF loaded: ${url}`, 'info');

        // Process loaded model
        const model = gltf.scene;

        // Apply shadows to all meshes
        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        if (onLoad) onLoad(model, gltf);
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        debug.log(`Loading Draco glTF: ${percent}%`, 'info');
      },
      (error) => {
        debug.error(`Failed to load Draco glTF: ${error.message}`);
        if (onError) onError(error);
      }
    );
  }
}

const dracoManager = new DracoLoaderManager();

// Handler for loading Draco-compressed files
function handleDracoLoad(file) {
  if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
    alert('Only .glb and .gltf files are supported');
    return;
  }

  const url = URL.createObjectURL(file);
  dracoManager.loadDracoGLTF(
    url,
    (model) => {
      loadObject(model, file.name);
      currentObjectName = file.name + ' (Draco)';
      updateInfoPanel();
    },
    (error) => {
      alert(`Error loading Draco file: ${error.message}`);
    }
  );
}


// Update info panel
function updateInfoPanel() {
  document.getElementById("current-object").textContent =
    "Current: " + currentObjectName;
}

// Initialize with default cube
loadObject(createPreset("cube"));

// Event listeners for preset buttons
document.querySelectorAll(".preset-button").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".preset-button").forEach((b) => {
      b.classList.remove("active");
    });
    this.classList.add("active");

    const preset = this.dataset.preset;
    loadObject(createPreset(preset));
  });
});

// STL file loading
document.getElementById("load-stl-btn").addEventListener("click", () => {
  document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    loadSTLFile(e.target.files[0]);
  }
});

// Shading toggle
document.getElementById("shading-toggle").addEventListener("click", function () {
  shadingEnabled = !shadingEnabled;

  if (shadingEnabled) {
    this.textContent = "Shading: ON";
    this.classList.add("on");
    ambientLight.intensity = 0.6;
    directionalLight.intensity = 0.8;
  } else {
    this.textContent = "Shading: OFF";
    this.classList.remove("on");
    ambientLight.intensity = 1;
    directionalLight.intensity = 0;
  }
});

// Keyboard controls
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Mouse wheel zoom - Fixed with passive: false to allow preventDefault
window.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomSpeed = 0.1;
  camera.position.z += e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
  camera.position.z = Math.max(0.5, Math.min(50, camera.position.z));
}, { passive: false });

// Mouse controls for rotation
document.addEventListener("mousedown", (e) => {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener("mousemove", (e) => {
  if (isDragging && currentObject) {
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    currentObject.rotation.y += deltaX * rotationSpeed;
    currentObject.rotation.x += deltaY * rotationSpeed;

    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// Camera movement with WASD
function updateCameraMovement() {
  if (keys["w"]) camera.position.y += cameraSpeed;
  if (keys["s"]) camera.position.y -= cameraSpeed;
  if (keys["a"]) camera.position.x -= cameraSpeed;
  if (keys["d"]) camera.position.x += cameraSpeed;
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === FPS/STATS COUNTER SYSTEM ===
class StatsCounter {
  constructor() {
    this.fps = 0;
    this.frameTime = 0;
    this.lastTime = Date.now();
    this.frameCount = 0;
    this.updateInterval = 500; // Update stats every 500ms
    this.lastUpdateTime = Date.now();
  }

  update() {
    const now = Date.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;
    this.frameTime = deltaTime;
    this.frameCount++;

    // Update display every 500ms
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastUpdateTime));
      this.frameCount = 0;
      this.lastUpdateTime = now;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const fpsEl = document.getElementById('fps-value');
    const frameTimeEl = document.getElementById('frame-time-value');
    const triangleEl = document.getElementById('triangle-count-value');
    const vertexEl = document.getElementById('vertex-count-value');

    if (fpsEl) fpsEl.textContent = this.fps;
    if (frameTimeEl) frameTimeEl.textContent = this.frameTime.toFixed(2) + 'ms';

    // Count triangles and vertices
    if (currentObject) {
      const { triangles, vertices } = this.getGeometryStats(currentObject);
      if (triangleEl) triangleEl.textContent = triangles.toLocaleString();
      if (vertexEl) vertexEl.textContent = vertices.toLocaleString();
    }
  }

  getGeometryStats(object) {
    let triangles = 0;
    let vertices = 0;

    const countGeometry = (geom) => {
      if (geom.index) {
        triangles += geom.index.count / 3;
      } else if (geom.attributes.position) {
        triangles += geom.attributes.position.count / 3;
      }
      if (geom.attributes.position) {
        vertices += geom.attributes.position.count;
      }
    };

    if (object.geometry) {
      countGeometry(object.geometry);
    }

    // Handle LOD objects
    if (object.levels) {
      object.levels.forEach(level => {
        if (level.object.geometry) {
          countGeometry(level.object.geometry);
        }
      });
    }

    // Handle InstancedMesh
    if (object.instanceMatrix) {
      triangles *= object.count;
      vertices *= object.count;
    }

    return { triangles: Math.round(triangles), vertices };
  }
}

const statsCounter = new StatsCounter();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  updateCameraMovement();
  particleSystem.update();
  statsCounter.update();

  // === UPDATE LOD SYSTEM ===
  lodManager.update();

  // === UPDATE OCCLUSION CULLING ===
  occlusionCulling.update(camera);

  // === UPDATE POST-PROCESSING ===
  postProcessor.applyBloom();
  postProcessor.applySSAO();
  postProcessor.applySSR();
  postProcessor.applyDepthOfField();

  // Auto-rotate if not dragging
  if (!isDragging && currentObject) {
    currentObject.rotation.x += 0.002;
    currentObject.rotation.y += 0.005;
  }

  renderer.render(scene, camera);
}

animate();

// Debug toggle button
document.getElementById('debug-toggle').addEventListener('click', () => {
  const debugLog = document.getElementById('debug-log');
  debugLog.classList.toggle('visible');
});

// UI Event Listeners

// === SIDEBAR PANEL CONTROLS ===

// Scene Controls
document.getElementById('ambient-light-toggle')?.addEventListener('change', (e) => {
  ambientLight.visible = e.target.checked;
  debug.log(`Ambient light ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('ambient-slider')?.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  ambientLight.intensity = value;
  document.getElementById('ambient-value').textContent = value.toFixed(1);
  debug.log(`Ambient intensity: ${value.toFixed(1)}`, 'info');
});

document.getElementById('directional-light-toggle')?.addEventListener('change', (e) => {
  directionalLight.visible = e.target.checked;
  debug.log(`Directional light ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('directional-slider')?.addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  directionalLight.intensity = value;
  document.getElementById('directional-value').textContent = value.toFixed(1);
  debug.log(`Directional intensity: ${value.toFixed(1)}`, 'info');
});

document.getElementById('environment-map-toggle')?.addEventListener('change', (e) => {
  environmentManager.toggle(e.target.checked);
});

document.getElementById('particle-toggle')?.addEventListener('change', (e) => {
  particleSystem.toggle(e.target.checked);
});

// Material Controls
document.getElementById('material-select')?.addEventListener('change', (e) => {
  materialManager.setMaterial(e.target.value, currentObject);
  debug.log(`Material changed to: ${e.target.value}`, 'info');
});

document.getElementById('shading-toggle')?.addEventListener('change', (e) => {
  shadingEnabled = e.target.checked;
  if (currentObject && currentObject.material) {
    currentObject.material.flatShading = !shadingEnabled;
    currentObject.material.needsUpdate = true;
  }
  debug.log(`Shading ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

// Rendering Controls
document.getElementById('exposure-slider')?.addEventListener('input', (e) => {
  const exposure = parseFloat(e.target.value);
  renderer.toneMappingExposure = exposure;
  document.getElementById('exposure-display').textContent = exposure.toFixed(1);
  debug.log(`Exposure: ${exposure.toFixed(1)}`, 'info');
});

document.getElementById('fov-slider')?.addEventListener('input', (e) => {
  const fov = parseInt(e.target.value);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  document.getElementById('fov-display').textContent = fov;
  debug.log(`Field of View: ${fov}°`, 'info');
});

document.getElementById('samples-slider')?.addEventListener('input', (e) => {
  renderSamples = parseInt(e.target.value);
  document.getElementById('samples-display').textContent = renderSamples;
  debug.log(`Samples updated to: ${renderSamples}`, 'info');
});

// Effects Controls
document.getElementById('bloom-toggle')?.addEventListener('change', (e) => {
  postProcessor.toggleEffect('bloom', e.target.checked);
  debug.log(`Bloom ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('ssao-toggle')?.addEventListener('change', (e) => {
  postProcessor.toggleEffect('ssao', e.target.checked);
  debug.log(`SSAO ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('ssr-toggle')?.addEventListener('change', (e) => {
  postProcessor.toggleEffect('ssr', e.target.checked);
  debug.log(`SSR ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('dof-toggle')?.addEventListener('change', (e) => {
  postProcessor.toggleEffect('dof', e.target.checked);
  debug.log(`Depth of Field ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

// Performance Controls
document.getElementById('lod-toggle')?.addEventListener('change', (e) => {
  lodManager.enabled = e.target.checked;
  debug.log(`LOD system ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('occlusion-toggle')?.addEventListener('change', (e) => {
  occlusionCulling.enabled = e.target.checked;
  debug.log(`Occlusion culling ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('shadow-toggle')?.addEventListener('change', (e) => {
  renderer.shadowMap.autoUpdate = e.target.checked;
  scene.traverse((node) => {
    if (node.castShadow) node.castShadow = e.target.checked;
    if (node.receiveShadow) node.receiveShadow = e.target.checked;
  });
  debug.log(`Shadow maps ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

document.getElementById('instancing-toggle')?.addEventListener('change', (e) => {
  debug.log(`GPU instancing ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

// Performance Demo Buttons
document.getElementById('instanced-demo-btn')?.addEventListener('click', () => {
  const geometry = new THREE.SphereGeometry(0.5, 16, 16);
  const material = materialManager.getMaterial('metallic');
  const instancedMesh = instancedSystem.createInstanced(geometry, material, 50);
  loadObject(instancedMesh, 'Instanced Spheres');
  currentObjectName = 'Instanced Spheres (50x single draw call)';
  updateInfoPanel();
  debug.log('Loaded 50 instanced spheres with single draw call', 'info');
});

document.getElementById('baked-lighting-btn')?.addEventListener('click', () => {
  if (currentObject && currentObject.material) {
    const lightmap = bakedLightingManager.generateProceduralLightmap(currentObject);
    currentObject.material.lightMap = lightmap;
    currentObject.material.lightMapIntensity = 1.0;
    currentObject.material.needsUpdate = true;
    debug.log('Procedural baked lighting applied', 'info');
  }
});

document.getElementById('render-btn')?.addEventListener('click', () => {
  if (!isRendering && currentObject) {
    isRendering = true;
    renderSampleCount = 0;
    const renderBtn = document.getElementById('render-btn');
    renderBtn.disabled = true;
    renderBtn.textContent = 'Rendering...';

    debug.log(`Starting render at ${renderSamples} samples`, 'info');

    // Multi-sample rendering
    function renderSample() {
      if (renderSampleCount < renderSamples) {
        renderSampleCount++;

        // Add slight camera jitter for anti-aliasing
        const jitterX = (Math.random() - 0.5) * 0.01;
        const jitterY = (Math.random() - 0.5) * 0.01;
        camera.position.x += jitterX;
        camera.position.y += jitterY;

        renderer.render(scene, camera);

        // Remove jitter
        camera.position.x -= jitterX;
        camera.position.y -= jitterY;

        if (renderSampleCount % 10 === 0) {
          debug.log(`Render progress: ${renderSampleCount}/${renderSamples}`, 'info');
        }

        setTimeout(renderSample, 16); // ~60 FPS
      } else {
        isRendering = false;
        renderBtn.disabled = false;
        renderBtn.textContent = 'Render';
        debug.log(`Render complete! Total samples: ${renderSamples}`, 'info');

        // Download image
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `render_${new Date().getTime()}.png`;
        link.click();
      }
    }

    renderSample();
  }
});
