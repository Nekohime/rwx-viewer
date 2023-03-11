import * as fflate from 'fflate';
import RWXLoader, {
  RWXMaterialManager,
} from 'three-rwx-loader';
import {Group, LoadingManager,
Vector2, Raycaster,
MeshBasicMaterial, TextureLoader, sRGBEncoding
} from 'three';


// WIP - Pain in the ass shit format, with an inflexible loader.
//  Blender isn't helping either.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { VRMLLoader } from 'three/addons/loaders/VRMLLoader.js';

import Environment from './Environment';
import MainObject from './Object';
import Utils from '../Utils';

const hasExtensionRegex = /^.*\.[^\\]+$/i;

export default class MainScene extends Group {
  constructor(camera) {
    super();
    this.camera = camera;
    this.json = require("../scene.json");
    this.environment = new Environment();

    this.object = new MainObject(this);

    this.path = this.json.path.base;
    this.path_models = this.json.path.models;

    // Utils.modelName normalizes a model's filename into a .rwx
    //  If a given filename has no extension, or is a .zip, (or a .rwx)
    //   It will give us the model's name with the .rwx extension
    this.modelName = Utils.modelName(this.json.ground);

    //Loader Stuff
    this.loadingManager = new LoadingManager();
    this.materialManager = null;
    this.loader = null;
    this.pointer = new Vector2();
    this.raycaster = new Raycaster();


  }

  init() {
    this.environment.init();
    this.object.init();
    //this.add(this.skybox); //TODO.
    this.add(this.environment);
    this.add(this.object);





    // We retrieve the normalized model's name, and use the appropriate loader
    //  based on the file extension We can add more conditions to setup new
    //   model loaders.
    if (this.modelName.endsWith('.rwx')) {
      this.setRWXLoader();
    } else if (this.modelName.endsWith('.gltf')) {
      this.setGLTFLoader();
    }


  }

  // RWXLoader
  setRWXLoader() {
    this.materialManager = new RWXMaterialManager(this.path + "textures",
      '.jpg', '.zip', fflate, false, this.textureEncoding);
    this.loader = (new RWXLoader(this.loadingManager))
      .setRWXMaterialManager(this.materialManager)
      .setPath(this.path + "rwx").setFlatten(true);
    this.loader.load(this.modelName, (model) => {
      model.name = this.modelName;

      this.add(model);
    }, null);
  }
  // GLTFLoader

  setGLTFLoader() {
    this.loader = new GLTFLoader();
    this.loader.load(this.path + this.path_models + this.modelName, (model) => {
      model.scene.name = this.modelName;
      console.log(model)
      //console.log(model.scene.name)


      this.add(model.scene);
    }, null);
  }

  update(delta) {
    this.raycaster.setFromCamera(this.pointer, this.camera);


    this.environment.update(delta);
    this.object.update(delta); // speed * timeStamp / 2500
  }
}
