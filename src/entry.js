import { WebGLRenderer, PerspectiveCamera, Scene, Vector3, sRGBEncoding } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import MainScene from './objects/Scene';

const scene = new Scene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({
  antialias: true, // smooth edges
  alpha: false,    // transparent background
  stencil: false
});
renderer.outputEncoding = sRGBEncoding;
renderer.shadowMap.enabled = false;


new OrbitControls(camera, renderer.domElement);
camera.position.set(6,3,10);
camera.lookAt(new Vector3(0,0,0));
const seedScene = new MainScene(camera);

scene.add(seedScene);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000044, 1); //0x7ec0ee

const onAnimationFrameHandler = (timeStamp) => {
  renderer.render(scene, camera);
  seedScene.update && seedScene.update(timeStamp);
  window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

const windowResizeHandler = () => {
  const { innerHeight, innerWidth } = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler);

document.body.style.margin = "0";
document.body.appendChild( renderer.domElement );
