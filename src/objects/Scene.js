import { Group, sRGBEncoding, Raycaster, Vector2 } from 'three';
import * as THREE from 'three';
import RWXLoader from 'three-rwx-loader';
import * as JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';

import Environment from './Environment';
import MainObject from './Object';
import Utils from '../Utils';

export default class MainScene extends Group {
  constructor(camera) {
    super();
    this.camera = camera;
    this.json = require("../scene.json");
    this.environment = new Environment();
    this.object = new MainObject(this);
    this.strict_mode = this.json.strict; //WIP - Makes certain behaviours more Lemuria-compliant
    this.groundLoader = new RWXLoader();
    this.path = this.json.path.base;
    this.path_models = this.path + this.json.path.models;
    this.path_textures = this.path + this.json.path.textures;

    this.ground_model = Utils.modelName(this.json.ground);
    this.groundLoader.setPath(this.path_models).setResourcePath(this.path_textures).setJSZip(JSZip, JSZipUtils).setWaitFullLoad(true).setFlatten(true).setTextureEncoding(sRGBEncoding);//.setUseBasicMaterial(true)
    this.groundLoader.load(this.ground_model, (ground) => {
      this.add(ground);
    });

    this.environment.init();
    //this.add(this.skybox); //TODO.
    this.add(this.environment);
    this.add(this.object);

  }

  init() {
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    let that = this;
    window.addEventListener('pointermove', function(event) {
      //console.log(that.pointer);
      that.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      that.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('pointerdown', function(event) {
      const intersects = that.raycaster.intersectObjects(that.children)
      if (intersects[0]) {
        let mediaPlayer = intersects[0].object.userData.mediaPlayer;
        let videoTexture = mediaPlayer.videoTexture;
        let video = mediaPlayer.videoElement;
        let source = video.querySelector('source');

        if (!video.paused)
          video.pause()
        else
          video.play();

        console.log(source);
        console.log(intersects[0].object.userData)
      }
      //for (let i = 0; i < intersects.length; i++) { console.log(intersects[i].object); }
    });
  }


  update(delta) {
      this.raycaster.setFromCamera(this.pointer, this.camera);


    this.environment.update(delta);
    this.object.update(delta); // speed * timeStamp / 2500
  }
}
