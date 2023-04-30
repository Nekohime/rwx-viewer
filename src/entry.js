import {Clock, WebGLRenderer, PerspectiveCamera, Scene, Vector3,
  SRGBColorSpace} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import MainScene from './objects/Scene';

const canvas = document.querySelector('canvas');

const scene = new Scene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: false, // Transparent background
  stencil: false,
});
renderer.outputColorSpace = SRGBColorSpace;
renderer.shadowMap.enabled = false;


const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(6, 3, 10);
camera.lookAt(new Vector3(0, 0, 0));
const seedScene = new MainScene(camera);
seedScene.init();

scene.add(seedScene);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000044, 1); // 0x7ec0ee

const clock = new Clock();
let delta = 0;
const interval = 1 / 120;

function update() {
  requestAnimationFrame(update);
  delta += clock.getDelta();

  if (delta > interval) {
    controls.update();

    renderer.render(scene, camera);
    seedScene.update && seedScene.update(delta);
    delta = delta & interval;
  }
}
update();

window.addEventListener('pointermove', function(event) {
  seedScene.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  seedScene.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
});

// TODO: Improve this.

window.addEventListener('pointerdown', function() {
  const intersects = seedScene.raycaster.intersectObjects(seedScene.children);

  if (intersects[0] && intersects[0].object.userData.mediaPlayer) {
    const mediaPlayer = intersects[0].object.userData.mediaPlayer;
    // let videoTexture = mediaPlayer.videoTexture; // Never used
    const video = mediaPlayer.videoElement;
    const source = video.querySelector('source');

    if (!video.paused) {
      video.pause();
    } else {
      video.play();
    }

    console.log(source);
    console.log(intersects[0].object.userData);
  }

  // Get the first object we come across and console.log it.
  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.name.length >= 1) {
      if (intersects[i].object.name.endsWith('.rwx')) {
        console.log(intersects[i].object);
      } else {
        console.log(intersects[i].object.parent.parent);
      }

      return;
    }
  }
});

const windowResizeHandler = () => {
  const {innerHeight, innerWidth} = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};

windowResizeHandler();
window.addEventListener('resize', windowResizeHandler);

const head = document.querySelector('head');
const favicon = document.createElement('link'); // Stop favicon requests
favicon.rel = 'icon';
favicon.type = 'image/x-icon';
favicon.href = 'data:,';
head.appendChild(favicon);

document.body.style.margin = '0';
// document.body.appendChild( renderer.domElement );
