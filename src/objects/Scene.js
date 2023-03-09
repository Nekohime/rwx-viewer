import RWXLoader, { RWXMaterialManager, } from 'three-rwx-loader';
import {Group, LoadingManager,
Vector2, Raycaster } from 'three';
import * as fflate from 'fflate';


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
    this.path = this.json.path.base;
    this.ground_model = Utils.modelName(this.json.ground);
    this.loadingManager = new LoadingManager();
    this.materialManager = new RWXMaterialManager(this.path + "textures",
      '.jpg', '.zip', fflate, false, this.textureEncoding);
    this.loader = (new RWXLoader(this.loadingManager))
    .setRWXMaterialManager(this.materialManager)
    .setPath(this.path + "rwx").setFlatten(true);


    this.environment.init();
    //this.add(this.skybox); //TODO.
    this.add(this.environment);
    this.add(this.object);

  }

  init() {
    this.pointer = new Vector2();
    this.raycaster = new Raycaster();

    let that = this;
    window.addEventListener('pointermove', function(event) {
      that.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      that.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('pointerdown', function(/* event */) {
      const intersects = that.raycaster.intersectObjects(that.children);
      if (intersects[0] && intersects[0].object.userData.mediaPlayer) {
          let mediaPlayer = intersects[0].object.userData.mediaPlayer;
          // let videoTexture = mediaPlayer.videoTexture; // Never used
          let video = mediaPlayer.videoElement;
          let source = video.querySelector('source');

          if (!video.paused)
            video.pause();
          else
            video.play();

          console.log(source);
          console.log(intersects[0].object.userData);
      }
      //for (let i = 0; i < intersects.length; i++) { console.log(intersects[i].object); }
    });
    const name = "ground1.rwx";
    this.loader.load(name, (rwx) => {
      rwx.name = name;
      this.add(rwx);
    }, null);
  }


  update(delta) {
      this.raycaster.setFromCamera(this.pointer, this.camera);


    //this.environment.update(delta);
    //this.object.update(delta); // speed * timeStamp / 2500
  }
}
