/**
 * entry.ts
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

import { WebGLRenderer, PerspectiveCamera,
  Scene, Vector3
 } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import MainScene from './objects/Scene';

const scene = new Scene()
const camera = new PerspectiveCamera()
const renderer = new WebGLRenderer({antialias: true})

//const controls = new TransformControls(camera, renderer.domElement)
const controls = new OrbitControls(camera, renderer.domElement)

const seedScene = new MainScene(controls)

// scene
//scene.add(controls) //for TransformControls
scene.add(seedScene)

// camera
camera.position.set(6,3,10);
camera.lookAt(new Vector3(0,0,0)); //Disable with orbitcontrols enabled
//controls.update()
// renderer
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(0x000044, 1) //0x7ec0ee



window.addEventListener('keydown', function (event) {
    switch (event.code) {
        case 'KeyG':
            controls.setMode('translate')
            console.log("help")
            break
        case 'KeyR':
            controls.setMode('rotate')
            break
        case 'KeyS':
            controls.setMode('scale')
            break
    }
})

// render loop
const onAnimationFrameHandler = (timeStamp) => {
  renderer.render(scene, camera);
  seedScene.update && seedScene.update(timeStamp);
  window.requestAnimationFrame(onAnimationFrameHandler);
  //camera.position.set(0,0,5)
}
window.requestAnimationFrame(onAnimationFrameHandler);



// resize
const windowResizeHanlder = () => {
  const { innerHeight, innerWidth } = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
windowResizeHanlder();
window.addEventListener('resize', windowResizeHanlder);

// dom
document.body.style.margin = "0";
document.body.appendChild( renderer.domElement );
