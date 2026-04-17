// https://aerotwist.com/tutorials/getting-started-with-three-js/

// Set the scene size.
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// Set some camera attributes.
let VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 0.1;
const FAR = 10000;

// Get the DOM element to attach to
const container = document.querySelector('#container');

// Create a WebGL renderer, camera and a scene
const renderer = new THREE.WebGLRenderer();
const camera =
    new THREE.PerspectiveCamera(
        VIEW_ANGLE,
        ASPECT,
        NEAR,
        FAR
    );

const scene = new THREE.Scene();

// Add the camera to the scene.
scene.add(camera);

// Start the renderer.
renderer.setSize(WIDTH, HEIGHT);

// Attach the renderer-supplied DOM element.
container.appendChild(renderer.domElement);


// create a point light
const pointLight =
new THREE.PointLight(0xFFFFFF);

// set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 130;

// add to the scene
scene.add(pointLight);

// create the sphere's material
const sphereMaterial = new THREE.MeshLambertMaterial({color: 0xCC0000});

// Set up the sphere vars
const RADIUS = 50;
const SEGMENTS = 16;
const RINGS = 16;

// Create a new mesh with
// sphere geometry - we will cover
// the sphereMaterial next!
const sphere = new THREE.Mesh(

  new THREE.SphereGeometry(
    RADIUS,
    SEGMENTS,
    RINGS),

  sphereMaterial);

// Move the Sphere back in Z so we
// can see it.
sphere.position.z = -300;

// Finally, add the sphere to the scene.
scene.add(sphere);


function update () {
  // Draw!
  renderer.render(scene, camera);

  if (forward.pressed) {
    VIEW_ANGLE += 1;
    camera.fov = VIEW_ANGLE;
    camera.updateProjectionMatrix();
  }
  if (backward.pressed) {
    VIEW_ANGLE -= 1;
    camera.fov = VIEW_ANGLE;
    camera.updateProjectionMatrix();
  }

  requestAnimationFrame(update);
}

requestAnimationFrame(update);

const controller = {
  forward: {
    key: ["w", "W", "ArrowUp"],
    pressed: false,
  },
  backward: {
    key: ["s", "S", "ArrowDown"],
    pressed: false,
  }
}

window.document.addEventListener("keydown", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = true;
    }
  }
});

window.document.addEventListener("keyup", function (e) {
  for (const controllerKey in controller) {
    if (controller[controllerKey].key.includes(e.key)) {
      controller[controllerKey].pressed = false;
    }
  }
});
