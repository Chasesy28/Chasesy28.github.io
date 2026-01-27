// 3D Modeling Studio - Blender-like Web App
// This app provides a full 3D modeling experience with local storage

// ===== INITIALIZATION =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(
  75,
  1, // Will be updated on resize
  0.1,
  1000
);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// ===== LIGHTING =====
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Grid helper
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(gridHelper);

// Axes helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// ===== STATE MANAGEMENT =====
const appState = {
  objects: [],
  selectedObject: null,
  workspace: 'layout',
  transformMode: 'translate', // translate, rotate, scale
  camera: {
    rotating: false,
    panning: false,
    lastX: 0,
    lastY: 0,
    distance: 10,
    phi: Math.PI / 4,
    theta: Math.PI / 4,
    target: new THREE.Vector3(0, 0, 0)
  },
  history: {
    undo: [],
    redo: []
  },
  projectName: 'Untitled'
};

// ===== INDEXED DB FOR LOCAL STORAGE =====
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('3DModelingStudio', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function saveProjectToDB(projectData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    const request = store.put(projectData);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function loadProjectFromDB(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllProjects() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== SCENE OBJECTS =====
function createPrimitive(type) {
  let geometry;
  
  switch(type) {
    case 'cube':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(0.5, 1, 32);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(1, 1);
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    metalness: 0,
    roughness: 0.5
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    type: type,
    name: `${type}_${appState.objects.length + 1}`
  };
  
  scene.add(mesh);
  appState.objects.push(mesh);
  
  selectObject(mesh);
  updateObjectList();
  updateStats();
  
  return mesh;
}

function selectObject(object) {
  // Deselect previous
  if (appState.selectedObject) {
    if (appState.selectedObject.userData.outline) {
      scene.remove(appState.selectedObject.userData.outline);
      appState.selectedObject.userData.outline = null;
    }
  }
  
  appState.selectedObject = object;
  
  if (object) {
    // Create outline
    const outlineGeometry = object.geometry.clone();
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.BackSide
    });
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outline.scale.multiplyScalar(1.05);
    outline.position.copy(object.position);
    outline.rotation.copy(object.rotation);
    outline.userData.isOutline = true;
    
    object.userData.outline = outline;
    scene.add(outline);
    
    updateTransformInputs();
  }
  
  updateObjectSelect();
}

function deleteSelected() {
  if (appState.selectedObject) {
    const index = appState.objects.indexOf(appState.selectedObject);
    if (index > -1) {
      appState.objects.splice(index, 1);
    }
    
    if (appState.selectedObject.userData.outline) {
      scene.remove(appState.selectedObject.userData.outline);
    }
    
    scene.remove(appState.selectedObject);
    appState.selectedObject = null;
    
    updateObjectList();
    updateObjectSelect();
    updateStats();
  }
}

function duplicateSelected() {
  if (appState.selectedObject) {
    const original = appState.selectedObject;
    const type = original.userData.type;
    const newObject = createPrimitive(type);
    
    newObject.position.copy(original.position);
    newObject.position.x += 1;
    newObject.rotation.copy(original.rotation);
    newObject.scale.copy(original.scale);
    
    if (original.material) {
      newObject.material = original.material.clone();
    }
  }
}

// ===== TRANSFORM OPERATIONS =====
function updateTransformInputs() {
  if (!appState.selectedObject) return;
  
  const obj = appState.selectedObject;
  
  document.getElementById('loc-x').value = obj.position.x.toFixed(2);
  document.getElementById('loc-y').value = obj.position.y.toFixed(2);
  document.getElementById('loc-z').value = obj.position.z.toFixed(2);
  
  document.getElementById('rot-x').value = THREE.MathUtils.radToDeg(obj.rotation.x).toFixed(0);
  document.getElementById('rot-y').value = THREE.MathUtils.radToDeg(obj.rotation.y).toFixed(0);
  document.getElementById('rot-z').value = THREE.MathUtils.radToDeg(obj.rotation.z).toFixed(0);
  
  document.getElementById('scale-x').value = obj.scale.x.toFixed(2);
  document.getElementById('scale-y').value = obj.scale.y.toFixed(2);
  document.getElementById('scale-z').value = obj.scale.z.toFixed(2);
  
  if (obj.material) {
    const color = '#' + obj.material.color.getHexString();
    document.getElementById('material-color').value = color;
    document.getElementById('metalness').value = obj.material.metalness;
    document.getElementById('roughness').value = obj.material.roughness;
  }
}

function applyTransformFromInputs() {
  if (!appState.selectedObject) return;
  
  const obj = appState.selectedObject;
  
  obj.position.x = parseFloat(document.getElementById('loc-x').value);
  obj.position.y = parseFloat(document.getElementById('loc-y').value);
  obj.position.z = parseFloat(document.getElementById('loc-z').value);
  
  obj.rotation.x = THREE.MathUtils.degToRad(parseFloat(document.getElementById('rot-x').value));
  obj.rotation.y = THREE.MathUtils.degToRad(parseFloat(document.getElementById('rot-y').value));
  obj.rotation.z = THREE.MathUtils.degToRad(parseFloat(document.getElementById('rot-z').value));
  
  obj.scale.x = parseFloat(document.getElementById('scale-x').value);
  obj.scale.y = parseFloat(document.getElementById('scale-y').value);
  obj.scale.z = parseFloat(document.getElementById('scale-z').value);
  
  // Update outline if exists
  if (obj.userData.outline) {
    obj.userData.outline.position.copy(obj.position);
    obj.userData.outline.rotation.copy(obj.rotation);
    obj.userData.outline.scale.copy(obj.scale).multiplyScalar(1.05);
  }
}

function applyMaterialFromInputs() {
  if (!appState.selectedObject || !appState.selectedObject.material) return;
  
  const mat = appState.selectedObject.material;
  const colorHex = document.getElementById('material-color').value;
  mat.color.set(colorHex);
  mat.metalness = parseFloat(document.getElementById('metalness').value);
  mat.roughness = parseFloat(document.getElementById('roughness').value);
}

// ===== UI UPDATES =====
function updateObjectList() {
  const select = document.getElementById('object-select');
  select.innerHTML = '<option value="">None</option>';
  
  appState.objects.forEach((obj, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = obj.userData.name || `Object ${index + 1}`;
    if (obj === appState.selectedObject) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function updateObjectSelect() {
  const select = document.getElementById('object-select');
  if (appState.selectedObject) {
    const index = appState.objects.indexOf(appState.selectedObject);
    select.value = index;
  } else {
    select.value = '';
  }
}

function updateStats() {
  let totalVertices = 0;
  let totalFaces = 0;
  
  appState.objects.forEach(obj => {
    if (obj.geometry) {
      totalVertices += obj.geometry.attributes.position.count;
      if (obj.geometry.index) {
        totalFaces += obj.geometry.index.count / 3;
      }
    }
  });
  
  document.getElementById('status-objects').textContent = appState.objects.length;
  document.getElementById('status-vertices').textContent = totalVertices;
  document.getElementById('status-faces').textContent = Math.floor(totalFaces);
}

// ===== CAMERA CONTROLS =====
function updateCameraPosition() {
  const state = appState.camera;
  camera.position.x = state.target.x + state.distance * Math.sin(state.phi) * Math.cos(state.theta);
  camera.position.y = state.target.y + state.distance * Math.cos(state.phi);
  camera.position.z = state.target.z + state.distance * Math.sin(state.phi) * Math.sin(state.theta);
  camera.lookAt(state.target);
}

function setCameraView(view) {
  const dist = appState.camera.distance;
  
  switch(view) {
    case 'front':
      camera.position.set(0, 0, dist);
      break;
    case 'back':
      camera.position.set(0, 0, -dist);
      break;
    case 'right':
      camera.position.set(dist, 0, 0);
      break;
    case 'left':
      camera.position.set(-dist, 0, 0);
      break;
    case 'top':
      camera.position.set(0, dist, 0);
      break;
    case 'bottom':
      camera.position.set(0, -dist, 0);
      break;
  }
  
  camera.lookAt(appState.camera.target);
}

// ===== FILE OPERATIONS =====
function serializeScene() {
  const sceneData = {
    name: appState.projectName,
    timestamp: Date.now(),
    objects: appState.objects.map(obj => ({
      type: obj.userData.type,
      name: obj.userData.name,
      position: obj.position.toArray(),
      rotation: obj.rotation.toArray(),
      scale: obj.scale.toArray(),
      material: {
        color: obj.material.color.getHex(),
        metalness: obj.material.metalness,
        roughness: obj.material.roughness
      }
    }))
  };
  
  return sceneData;
}

function deserializeScene(sceneData) {
  // Clear current scene
  appState.objects.forEach(obj => {
    if (obj.userData.outline) {
      scene.remove(obj.userData.outline);
    }
    scene.remove(obj);
  });
  appState.objects = [];
  appState.selectedObject = null;
  
  // Load objects
  sceneData.objects.forEach(objData => {
    const obj = createPrimitive(objData.type);
    obj.userData.name = objData.name;
    obj.position.fromArray(objData.position);
    obj.rotation.fromArray(objData.rotation);
    obj.scale.fromArray(objData.scale);
    obj.material.color.setHex(objData.material.color);
    obj.material.metalness = objData.material.metalness;
    obj.material.roughness = objData.material.roughness;
  });
  
  appState.projectName = sceneData.name || 'Untitled';
  
  if (appState.objects.length > 0) {
    selectObject(null);
  }
  
  updateObjectList();
  updateStats();
}

async function saveProject() {
  const sceneData = serializeScene();
  
  try {
    const id = await saveProjectToDB(sceneData);
    showNotification(`Project saved (ID: ${id})`, 'success');
  } catch (error) {
    console.error('Error saving project:', error);
    showNotification('Error saving project', 'error');
  }
}

async function openProject() {
  try {
    const projects = await getAllProjects();
    
    if (projects.length === 0) {
      showNotification('No saved projects found', 'info');
      return;
    }
    
    // For now, load the most recent project
    const latest = projects[projects.length - 1];
    deserializeScene(latest);
    showNotification(`Loaded: ${latest.name}`, 'success');
  } catch (error) {
    console.error('Error loading project:', error);
    showNotification('Error loading project', 'error');
  }
}

function newProject() {
  if (confirm('Create new project? Unsaved changes will be lost.')) {
    deserializeScene({ name: 'Untitled', objects: [] });
    showNotification('New project created', 'success');
  }
}

function exportProject() {
  const sceneData = serializeScene();
  const json = JSON.stringify(sceneData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${appState.projectName}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showNotification('Project exported', 'success');
}

function importProject() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const sceneData = JSON.parse(event.target.result);
        deserializeScene(sceneData);
        showNotification('Project imported', 'success');
      } catch (error) {
        console.error('Error importing project:', error);
        showNotification('Error importing project', 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Could add a toast notification system here
}

// ===== EVENT HANDLERS =====
function handleResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Sidebar toggle
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  
  const toggle = document.getElementById('sidebar-toggle');
  toggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
  
  // Trigger resize to adjust canvas
  setTimeout(handleResize, 300);
});

// Workspace tabs
document.querySelectorAll('.workspace-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.workspace-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    appState.workspace = tab.dataset.workspace;
    showNotification(`Switched to ${tab.textContent} workspace`, 'info');
  });
});

// Menu actions
document.querySelectorAll('[data-action]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = item.dataset.action;
    
    switch(action) {
      case 'new': newProject(); break;
      case 'open': openProject(); break;
      case 'save': saveProject(); break;
      case 'saveas': saveProject(); break;
      case 'export': exportProject(); break;
      case 'import': importProject(); break;
      case 'delete': deleteSelected(); break;
      case 'duplicate': duplicateSelected(); break;
      case 'add-cube': createPrimitive('cube'); break;
      case 'add-sphere': createPrimitive('sphere'); break;
      case 'add-cylinder': createPrimitive('cylinder'); break;
      case 'add-cone': createPrimitive('cone'); break;
      case 'add-torus': createPrimitive('torus'); break;
      case 'add-plane': createPrimitive('plane'); break;
      case 'view-front': setCameraView('front'); break;
      case 'view-back': setCameraView('back'); break;
      case 'view-right': setCameraView('right'); break;
      case 'view-left': setCameraView('left'); break;
      case 'view-top': setCameraView('top'); break;
      case 'view-bottom': setCameraView('bottom'); break;
    }
  });
});

// Object selection
document.getElementById('object-select').addEventListener('change', (e) => {
  const index = parseInt(e.target.value);
  if (!isNaN(index) && index >= 0 && index < appState.objects.length) {
    selectObject(appState.objects[index]);
  } else {
    selectObject(null);
  }
});

// Transform inputs
['loc-x', 'loc-y', 'loc-z', 'rot-x', 'rot-y', 'rot-z', 'scale-x', 'scale-y', 'scale-z'].forEach(id => {
  document.getElementById(id).addEventListener('input', applyTransformFromInputs);
});

// Material inputs
['material-color', 'metalness', 'roughness'].forEach(id => {
  document.getElementById(id).addEventListener('input', applyMaterialFromInputs);
});

// Lighting controls
document.getElementById('ambient-intensity').addEventListener('input', (e) => {
  ambientLight.intensity = parseFloat(e.target.value);
});

document.getElementById('directional-intensity').addEventListener('input', (e) => {
  directionalLight.intensity = parseFloat(e.target.value);
});

// Mouse controls for camera
let mouseDown = false;
let mouseButton = 0;

renderer.domElement.addEventListener('mousedown', (e) => {
  mouseDown = true;
  mouseButton = e.button;
  appState.camera.lastX = e.clientX;
  appState.camera.lastY = e.clientY;
  
  if (e.button === 0) { // Left click
    appState.camera.rotating = true;
  } else if (e.button === 1) { // Middle click
    e.preventDefault();
    appState.camera.panning = true;
  }
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (!mouseDown) return;
  
  const deltaX = e.clientX - appState.camera.lastX;
  const deltaY = e.clientY - appState.camera.lastY;
  
  if (appState.camera.rotating) {
    appState.camera.theta += deltaX * 0.01;
    appState.camera.phi -= deltaY * 0.01;
    appState.camera.phi = Math.max(0.1, Math.min(Math.PI - 0.1, appState.camera.phi));
    updateCameraPosition();
  } else if (appState.camera.panning) {
    const panSpeed = 0.01;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    camera.getWorldDirection(right);
    right.cross(up).normalize();
    
    appState.camera.target.add(right.multiplyScalar(-deltaX * panSpeed));
    appState.camera.target.y += deltaY * panSpeed;
    updateCameraPosition();
  }
  
  appState.camera.lastX = e.clientX;
  appState.camera.lastY = e.clientY;
});

renderer.domElement.addEventListener('mouseup', () => {
  mouseDown = false;
  appState.camera.rotating = false;
  appState.camera.panning = false;
});

renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Mouse wheel zoom - Fixed with passive: false
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomSpeed = 0.1;
  appState.camera.distance += e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
  appState.camera.distance = Math.max(1, Math.min(50, appState.camera.distance));
  updateCameraPosition();
}, { passive: false });

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Check if typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  const ctrl = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  
  if (ctrl && e.key === 's') {
    e.preventDefault();
    saveProject();
  } else if (ctrl && e.key === 'o') {
    e.preventDefault();
    openProject();
  } else if (ctrl && e.key === 'n') {
    e.preventDefault();
    newProject();
  } else if (ctrl && e.key === 'e') {
    e.preventDefault();
    exportProject();
  } else if (ctrl && e.key === 'i') {
    e.preventDefault();
    importProject();
  } else if (e.key === 'x' || e.key === 'Delete') {
    deleteSelected();
  } else if (shift && e.key === 'D') {
    duplicateSelected();
  } else if (shift && e.key === 'A') {
    // Quick add menu (simplified)
    createPrimitive('cube');
  }
});

// ===== RENDER LOOP =====
let lastTime = performance.now();
let frameCount = 0;
let fpsUpdateTime = 0;

function animate() {
  requestAnimationFrame(animate);
  
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update FPS
  frameCount++;
  fpsUpdateTime += deltaTime;
  if (fpsUpdateTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / fpsUpdateTime);
    document.getElementById('status-fps').textContent = fps;
    frameCount = 0;
    fpsUpdateTime = 0;
  }
  
  renderer.render(scene, camera);
}

// ===== INITIALIZATION =====
async function init() {
  try {
    await initDB();
    console.log('IndexedDB initialized');
  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
  }
  
  handleResize();
  window.addEventListener('resize', handleResize);
  
  updateCameraPosition();
  
  // Create initial cube
  createPrimitive('cube');
  
  animate();
  
  showNotification('3D Modeling Studio loaded', 'success');
}

// Start the application
init();

// ===== SERVICE WORKER FOR PWA =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker registered', reg))
    .catch(err => console.error('Service Worker registration failed', err));
}
